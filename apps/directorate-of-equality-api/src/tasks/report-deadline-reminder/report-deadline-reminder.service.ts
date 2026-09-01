import { Op, WhereOptions } from 'sequelize'

import { Inject, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import {
  CompanyDeadlineReminderEventType,
  CompanyEventTypeEnum,
  CompanyModel,
  CompanyReminderTierEnum,
  CompanyStatusEnum,
} from '@dmr.is/doe-modules/company'
import { ICompanyEventService } from '@dmr.is/doe-modules/company-event'
import {
  IDoeMailService,
  looksLikeOneAddress,
  MailSendError,
} from '@dmr.is/doe-modules/mail'
import { ReportTypeEnum } from '@dmr.is/doe-modules/report'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { REPORT_DEADLINE_REMINDER_LOGGING_CONTEXT } from '../constants'
import { IReportDeadlineReminderService } from './report-deadline-reminder.service.interface'

const LOGGING_CONTEXT = REPORT_DEADLINE_REMINDER_LOGGING_CONTEXT

/** One row of the deadline matrix the task walks — equality and salary. */
type DeadlineKind = {
  /** Company column holding the due date. */
  dueField: 'nextEqualityReportDueAt' | 'nextSalaryReportDueAt'
  reportType: ReportTypeEnum
  /** Event recorded once a reminder is sent. */
  sentEventType: CompanyDeadlineReminderEventType
  /** Event recorded when a reminder is due but no email is on file. */
  noEmailEventType: CompanyDeadlineReminderEventType
}

const DEADLINE_KINDS: DeadlineKind[] = [
  {
    dueField: 'nextEqualityReportDueAt',
    reportType: ReportTypeEnum.EQUALITY,
    sentEventType: CompanyEventTypeEnum.EQUALITY_REPORT_DEADLINE_REMINDER_SENT,
    noEmailEventType:
      CompanyEventTypeEnum.EQUALITY_REPORT_DEADLINE_REMINDER_NO_EMAIL,
  },
  {
    dueField: 'nextSalaryReportDueAt',
    reportType: ReportTypeEnum.SALARY,
    sentEventType: CompanyEventTypeEnum.SALARY_REPORT_DEADLINE_REMINDER_SENT,
    noEmailEventType:
      CompanyEventTypeEnum.SALARY_REPORT_DEADLINE_REMINDER_NO_EMAIL,
  },
]

/**
 * How far past the due date the DUE tier still fires. Bounds the tier so that
 * shipping the task (or setting a due date) does not blast a reminder at every
 * long-overdue company — only those overdue within this window get the
 * on-due-date reminder; anything older is left alone.
 */
const DUE_TIER_FLOOR_DAYS = 30

/**
 * The reminder milestones, far to near. Each owns a contiguous band of due
 * dates down to the next tier, so a deadline falls in exactly one tier per run
 * (and a missed run still leaves it inside the band next time). `dueRange`
 * builds the half-open `(lower, upper]` window for the given `now`; the DUE
 * tier covers today back to `DUE_TIER_FLOOR_DAYS` ago.
 */
type Tier = {
  tier: CompanyReminderTierEnum
  dueRange: (now: Date) => WhereOptions
}

const TIERS: Tier[] = [
  {
    tier: CompanyReminderTierEnum.SIX_MONTHS,
    dueRange: (now) => ({ [Op.gt]: addMonths(now, 2), [Op.lte]: addMonths(now, 6) }),
  },
  {
    tier: CompanyReminderTierEnum.TWO_MONTHS,
    dueRange: (now) => ({ [Op.gt]: addDays(now, 14), [Op.lte]: addMonths(now, 2) }),
  },
  {
    tier: CompanyReminderTierEnum.TWO_WEEKS,
    dueRange: (now) => ({ [Op.gt]: now, [Op.lte]: addDays(now, 14) }),
  },
  {
    tier: CompanyReminderTierEnum.DUE,
    dueRange: (now) => ({
      [Op.gt]: addDays(now, -DUE_TIER_FLOOR_DAYS),
      [Op.lte]: now,
    }),
  },
]

const addMonths = (date: Date, months: number): Date => {
  const result = new Date(date)
  result.setMonth(result.getMonth() + months)
  return result
}

const addDays = (date: Date, days: number): Date => {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

@Injectable()
export class ReportDeadlineReminderService
  implements IReportDeadlineReminderService
{
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @InjectModel(CompanyModel)
    private readonly companyModel: typeof CompanyModel,
    @Inject(ICompanyEventService)
    private readonly companyEventService: ICompanyEventService,
    @Inject(IDoeMailService)
    private readonly mailService: IDoeMailService,
  ) {}

  async run(): Promise<void> {
    const now = new Date()

    for (const kind of DEADLINE_KINDS) {
      for (const tier of TIERS) {
        await this.processTier(kind, tier, now)
      }
    }
  }

  private async processTier(
    kind: DeadlineKind,
    tier: Tier,
    now: Date,
  ): Promise<void> {
    // Active, non-quarantined companies whose deadline currently sits in this
    // tier's band. `quarantined` is an admin halt switch — no outbound activity
    // for those companies (see PR #1321) — so they are excluded at the query
    // level. Per-tier dedup happens per-company below.
    const companies = await this.companyModel.findAll({
      where: {
        status: CompanyStatusEnum.ACTIVE,
        quarantined: false,
        [kind.dueField]: tier.dueRange(now),
      },
    })

    if (companies.length > 0) {
      this.logger.info(
        `Found ${companies.length} companies in ${tier.tier} band for ${kind.reportType}`,
        { context: LOGGING_CONTEXT, reportType: kind.reportType, tier: tier.tier },
      )
    }

    for (const company of companies) {
      /*
       * ⚠️ **Per-company, so one bad recipient cannot abort the run.**
       *
       * `sendReportDeadlineReminder` throws on a failed send — that is its
       * contract, and what keeps a failure out of the SENT event so the next run
       * retries it. But nothing above this used to catch, and
       * `AdvisoryLockService` runs the whole task inside one transaction: the
       * first failure aborted every remaining company, every remaining tier and
       * the second report kind, and rolled back the `job_runs` bookkeeping with
       * it.
       *
       * That is worse than the bug it replaced. `company.email` is admin-set,
       * nullable, and validated by nothing, so one permanently bad-but-truthy
       * address would re-abort every run — and because the SENT event is written
       * only after a successful send, that company stays in the band and keeps
       * blocking everyone after it. Statutory deadline notices, withheld
       * indefinitely.
       *
       * ⚠️ **Only a `MailSendError`.** Everything else rethrows, and it has to:
       * `AdvisoryLockService` runs this whole task in one transaction and CLS is
       * live for this app, so the model queries here enlist in it. A DB error
       * therefore aborts the transaction — every later statement fails `25P02`,
       * a blanket catch swallows each one, and Postgres answers the eventual
       * `COMMIT` on an aborted transaction with a silent `ROLLBACK`. The task
       * would report success having mailed every company in the band while every
       * `SENT` event and the `job_runs` cooldown were discarded, and the next run
       * would mail them all again. A deterministic fault on the event insert
       * turns that into a repeating storm.
       *
       * So a database fault must stay loud, exactly as it did before this catch
       * existed.
       *
       * ⚠️ **"Loud" means the PROCESS, not the run.** The rethrow reaches an
       * `async` `@Cron` method; cron does not await the callback, so this becomes
       * an unhandled rejection, and this repo's winston config sets
       * `exitOnError` with `rejectionHandlers`, which exits the container. ECS
       * restarts it. That is `main`'s behaviour for every error in this task
       * already — `main`'s `processTier` has no catch at all — so it is not
       * introduced here, and `report-deadline-reminder.task.ts` now catches at
       * the `@Cron` boundary so the run aborts without taking the API with it.
       *
       * The `job_runs` row rolls back with the abort. That is the right trade,
       * but it is not free: SES is not transactional, so any company already
       * emailed in this run WILL be emailed again on the next one, because its
       * `SENT` event rolled back too. Bounded by where the fault hits, and far
       * better than the blanket catch it replaced, which mailed the entire band
       * with nothing recorded.
       */
      try {
        await this.remindCompany(company, kind, tier.tier)
      } catch (error) {
        if (!(error instanceof MailSendError)) {
          throw error
        }

        this.logger.error(
          `Could not email company ${company.id} its ${kind.reportType} ${tier.tier} reminder — continuing with the rest of the batch`,
          {
            context: LOGGING_CONTEXT,
            companyId: company.id,
            reportType: kind.reportType,
            tier: tier.tier,
            message: error instanceof Error ? error.message : String(error),
          },
        )
      }
    }
  }

  private async remindCompany(
    company: CompanyModel,
    kind: DeadlineKind,
    tier: CompanyReminderTierEnum,
  ): Promise<void> {
    const dueDate = company[kind.dueField]
    if (!dueDate) return

    const dueDateIso = dueDate.toISOString()

    const alreadySent =
      await this.companyEventService.hasDeadlineReminderEvent(
        company.id,
        kind.sentEventType,
        tier,
        dueDateIso,
      )
    if (alreadySent) return

    /*
     * ⚠️ Same rule as the report mail — `looksLikeOneAddress`, from the mail
     * module — not a truthiness test.
     *
     * `company.email` is admin-set, nullable and validated by nothing, so a
     * truthy-but-unusable value used to sail past this check into a send that
     * could never succeed. Because the `SENT` event is only written after a
     * successful send and `flagMissingEmail` was skipped, that company got no
     * event of either kind: silently retried every run, forever, with nothing on
     * its timeline for an admin to notice.
     *
     * An unusable address is now the same finding as a missing one — it is, from
     * the company's side — so it lands on the timeline once per tier per cycle.
     */
    const to = company.email?.trim()
    if (!looksLikeOneAddress(to)) {
      await this.flagMissingEmail(company, kind, tier, dueDateIso)
      return
    }

    await this.mailService.sendReportDeadlineReminder(to, {
      companyName: company.name,
      reportType: kind.reportType,
      tier,
      dueDate,
    })

    // Only recorded after a successful send, so a failed send retries next run.
    await this.companyEventService.emitDeadlineReminderEvent(
      company.id,
      company.status,
      kind.sentEventType,
      tier,
      dueDateIso,
    )
  }

  /**
   * Records a NO_EMAIL event on the company timeline so the gap is visible to
   * admins. Deduped per (tier, due date) — same key as the sent event — so a
   * company with no usable email gets one event per tier per cycle, not one per
   * run.
   *
   * Covers a stored value that cannot be mailed as well as a null one: both leave
   * the company un-notified, which is the thing an admin needs to see.
   */
  private async flagMissingEmail(
    company: CompanyModel,
    kind: DeadlineKind,
    tier: CompanyReminderTierEnum,
    dueDateIso: string,
  ): Promise<void> {
    const alreadyFlagged =
      await this.companyEventService.hasDeadlineReminderEvent(
        company.id,
        kind.noEmailEventType,
        tier,
        dueDateIso,
      )
    if (alreadyFlagged) return

    this.logger.warn(
      `Tried to send ${kind.reportType} ${tier} reminder for company ${company.id} but no usable email is on file`,
      {
        context: LOGGING_CONTEXT,
        companyId: company.id,
        reportType: kind.reportType,
        tier,
      },
    )

    await this.companyEventService.emitDeadlineReminderEvent(
      company.id,
      company.status,
      kind.noEmailEventType,
      tier,
      dueDateIso,
    )
  }
}
