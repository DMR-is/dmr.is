import { literal, Op, WhereOptions } from 'sequelize'

import { Inject, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import {
  CompanyDeadlineReminderEventType,
  CompanyEventTypeEnum,
  CompanyModel,
  CompanyReminderTierEnum,
  CompanyStatusEnum,
  equalityRequiredSql,
  salaryRequiredSql,
} from '@dmr.is/doe-modules/company'
import { ICompanyEventService } from '@dmr.is/doe-modules/company-event'
import {
  IDoeMailService,
  looksLikeOneAddress,
  MailSendError,
} from '@dmr.is/doe-modules/mail'
import {
  buildMailboxDeliveryIdempotencyKey,
  DeliverToMailboxResult,
  IMailboxDeliveryService,
  isMailboxDeliveryEnabled,
  MailboxDeliveryKindEnum,
  MailboxDeliveryState,
  MailboxDeliveryStatusEnum,
} from '@dmr.is/doe-modules/mailbox-delivery'
import {
  buildDeadlineReminderLetter,
  noticeLetterStyles,
} from '@dmr.is/doe-modules/notice-letter'
import { IPdfRenderService } from '@dmr.is/doe-modules/pdf-render'
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
  /**
   * SQL boolean: does the company actually owe this report?
   *
   * ⚠️ Load-bearing, and imported rather than restated. A due date being in the
   * past is NOT the same as a deadline being owed: the register load seeds
   * `next_equality_report_due_at` from the old SharePoint sheet's `Gildistíma
   * jafnréttisáætlunar` for companies of EVERY size, so companies below 25 —
   * which owe no plan at all — carry live dates. Without this gate they fall
   * into the tiers below and are mailed a statutory deadline notice for an
   * obligation they do not have.
   *
   * The salary side was never exposed to that (the load size-gates it on insert
   * and clears it on upsert), but it is gated here too: an admin clearing
   * `salary_report_required_override` must not leave the company being mailed
   * against a date the approval flow wrote while the override stood.
   *
   * These are the same expressions the register's own status columns and list
   * filter are built from (`@dmr.is/doe-modules/company`), so the mailer and the
   * admin UI cannot come to disagree about who owes what.
   */
  obligation: string
  /** Event recorded once a reminder is sent. */
  sentEventType: CompanyDeadlineReminderEventType
  /** Event recorded when a reminder is due but no email is on file. */
  noEmailEventType: CompanyDeadlineReminderEventType
  /**
   * Event recorded when the mailbox delivery ran out of attempts without One
   * sending it, and no later run will finish it on its own.
   */
  undeliveredEventType: CompanyDeadlineReminderEventType
  /**
   * Event recorded when whether One sent the reminder is unknown (UNCERTAIN,
   * or interrupted mid-call): a person must check One. Not UNDELIVERED, which
   * would read as a confirmed non-delivery of a reminder One may have sent.
   */
  unconfirmedEventType: CompanyDeadlineReminderEventType
  /** The mailbox kind, when the reminder goes through One. */
  mailboxKind: MailboxDeliveryKindEnum
}

const DEADLINE_KINDS: DeadlineKind[] = [
  {
    dueField: 'nextEqualityReportDueAt',
    reportType: ReportTypeEnum.EQUALITY,
    obligation: equalityRequiredSql,
    sentEventType: CompanyEventTypeEnum.EQUALITY_REPORT_DEADLINE_REMINDER_SENT,
    noEmailEventType:
      CompanyEventTypeEnum.EQUALITY_REPORT_DEADLINE_REMINDER_NO_EMAIL,
    undeliveredEventType:
      CompanyEventTypeEnum.EQUALITY_REPORT_DEADLINE_REMINDER_UNDELIVERED,
    unconfirmedEventType:
      CompanyEventTypeEnum.EQUALITY_REPORT_DEADLINE_REMINDER_UNCONFIRMED,
    mailboxKind: MailboxDeliveryKindEnum.EQUALITY_REPORT_DEADLINE_REMINDER,
  },
  {
    dueField: 'nextSalaryReportDueAt',
    reportType: ReportTypeEnum.SALARY,
    obligation: salaryRequiredSql,
    sentEventType: CompanyEventTypeEnum.SALARY_REPORT_DEADLINE_REMINDER_SENT,
    noEmailEventType:
      CompanyEventTypeEnum.SALARY_REPORT_DEADLINE_REMINDER_NO_EMAIL,
    undeliveredEventType:
      CompanyEventTypeEnum.SALARY_REPORT_DEADLINE_REMINDER_UNDELIVERED,
    unconfirmedEventType:
      CompanyEventTypeEnum.SALARY_REPORT_DEADLINE_REMINDER_UNCONFIRMED,
    mailboxKind: MailboxDeliveryKindEnum.SALARY_REPORT_DEADLINE_REMINDER,
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
    dueRange: (now) => ({
      [Op.gt]: addMonths(now, 2),
      [Op.lte]: addMonths(now, 6),
    }),
  },
  {
    tier: CompanyReminderTierEnum.TWO_MONTHS,
    dueRange: (now) => ({
      [Op.gt]: addDays(now, 14),
      [Op.lte]: addMonths(now, 2),
    }),
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
    @Inject(IMailboxDeliveryService)
    private readonly mailboxDeliveryService: IMailboxDeliveryService,
    @Inject(IPdfRenderService)
    private readonly pdfRenderService: IPdfRenderService,
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
    // Active, non-quarantined companies that OWE this report and whose deadline
    // currently sits in this tier's band. `quarantined` is an admin halt switch
    // — no outbound activity for those companies (see PR #1321) — so they are
    // excluded at the query level. Per-tier dedup happens per-company below.
    //
    // ⚠️ `kind.obligation` is raw SQL qualified with the `CompanyModel` alias,
    // which is what Sequelize names the table in this very query
    // (`FROM "company" AS "CompanyModel"`). It is not user input — the two
    // values are module constants. See the note on `DeadlineKind.obligation`
    // for why a due date alone is not enough.
    const companies = await this.companyModel.findAll({
      where: {
        status: CompanyStatusEnum.ACTIVE,
        quarantined: false,
        [kind.dueField]: tier.dueRange(now),
        [Op.and]: literal(kind.obligation),
      },
    })

    if (companies.length > 0) {
      this.logger.info(
        `Found ${companies.length} companies in ${tier.tier} band for ${kind.reportType}`,
        {
          context: LOGGING_CONTEXT,
          reportType: kind.reportType,
          tier: tier.tier,
        },
      )
    }

    for (const company of companies) {
      // A kind with no case template yet falls back to email, so a band that
      // closes before the template is set is not lost. Both channels write
      // `kind.sentEventType`, so the mailbox does not send it again later.
      if (
        isMailboxDeliveryEnabled() &&
        (await this.remindCompanyByMailbox(company, kind, tier.tier, now))
      ) {
        continue
      }

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

    const alreadySent = await this.companyEventService.hasDeadlineReminderEvent(
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
   * Delivers the reminder to the company's island.is mailbox through One, in
   * place of the email. The mailbox is addressed by kennitala, so the company's
   * email address plays no part and no NO_EMAIL event is written.
   *
   * The SENT event is written only when One confirms the send. The delivery's
   * key (kind, company, tier, due date) is what stops a second send: an
   * UNCERTAIN or exhausted delivery keeps answering the same on every later
   * run, without calling One, until a person settles it. Such a delivery gets
   * an event once per tier and due date, UNCONFIRMED when whether One sent it
   * is unknown and UNDELIVERED when it ran out of attempts, so the gap is on
   * the company's timeline as the email path's NO_EMAIL is; doe-api's daily
   * mailbox alert names the delivery to settle.
   *
   * The event is written on the call that left the delivery so, too. That
   * call throws rather than returning UNCERTAIN or exhausted, so the
   * delivery's row is read back: waiting for a later run would miss a failure
   * on the band's last day, or before the due date moves.
   *
   * Returns false only for `UNCONFIGURED` (the flag on before the kind's case
   * template is set): nothing went to One and no row was written, so
   * `processTier` emails the reminder instead. `deliverToMailbox` logged it at
   * error, and the daily alert and the boot check name the kind.
   *
   * ⚠️ **Flipping the flags.** Both channels need `EMAIL_REMINDER_JOB_ENABLED`
   * (the task does not run without it), so with it off nothing is sent by
   * either. Turning `ONESYSTEMS_ENABLED` off while a reminder's delivery is
   * UNCERTAIN emails that reminder on the next run, since only a SENT event
   * stops the email path: the company may then have it twice. Settle UNCERTAIN
   * deliveries before turning the flag off.
   *
   * ⚠️ **A delivery failure is caught here, per company.** It is not a
   * database fault on the lock's transaction: `deliverToMailbox` records its own
   * state outside every ambient transaction (`transaction: null`) and rethrows
   * only after recording it. Letting it out would abort the run at the first
   * company One rejects, every day, and withhold every reminder behind it. So
   * is a failure to read that state back (`findDelivery`, its own pool
   * connection). The event inserts stay outside the catch, so a fault there
   * still aborts the run as `processTier` requires.
   */
  private async remindCompanyByMailbox(
    company: CompanyModel,
    kind: DeadlineKind,
    tier: CompanyReminderTierEnum,
    now: Date,
  ): Promise<boolean> {
    const dueDate = company[kind.dueField]
    if (!dueDate) return true

    const dueDateIso = dueDate.toISOString()

    const alreadySent = await this.companyEventService.hasDeadlineReminderEvent(
      company.id,
      kind.sentEventType,
      tier,
      dueDateIso,
    )
    if (alreadySent) return true

    const letter = buildDeadlineReminderLetter(
      {
        companyName: company.name,
        reportType: kind.reportType,
        tier,
        dueDate,
      },
      now,
    )
    const meta = {
      context: LOGGING_CONTEXT,
      companyId: company.id,
      reportType: kind.reportType,
      tier,
    }

    const idempotencyKey = buildMailboxDeliveryIdempotencyKey({
      kind: kind.mailboxKind,
      companyId: company.id,
      discriminator: `${kind.reportType}-${tier}-${dueDateIso
        .slice(0, 10)
        .replace(/-/g, '')}`,
    })

    let result: DeliverToMailboxResult | null = null
    try {
      result = await this.mailboxDeliveryService.deliverToMailbox({
        idempotencyKey,
        kind: kind.mailboxKind,
        companyId: company.id,
        subject: letter.subject,
        pdf: () =>
          this.pdfRenderService.renderHtml(
            letter.html,
            noticeLetterStyles,
            'letter',
          ),
      })
    } catch (error) {
      this.logger.error(
        `Could not deliver company ${company.id} its ${kind.reportType} ${tier} reminder to the mailbox — continuing with the rest of the batch`,
        {
          ...meta,
          message: error instanceof Error ? error.message : String(error),
        },
      )
    }

    if (result?.status === 'SENT') {
      await this.companyEventService.emitDeadlineReminderEvent(
        company.id,
        company.status,
        kind.sentEventType,
        tier,
        dueDateIso,
      )
      return true
    }

    // Already logged at error by `deliverToMailbox`.
    if (result?.status === 'UNCONFIGURED') {
      this.logger.info(
        `${kind.reportType} ${tier} reminder for company ${company.id} goes by email: mailbox kind ${result.kind} has no case template`,
        meta,
      )
      return false
    }

    if (result) {
      this.logger.error(
        `${kind.reportType} ${tier} reminder for company ${company.id} was not delivered to the mailbox: ${result.status}`,
        {
          ...meta,
          deliveryId: 'deliveryId' in result ? result.deliveryId : undefined,
        },
      )
    }

    const eventType = await this.stoppedEventType(
      kind,
      result,
      idempotencyKey,
      meta,
    )
    // Outside any catch: a fault on the lock's transaction must abort the
    // run, as for the SENT event.
    if (eventType) {
      await this.flagStopped(company, eventType, tier, dueDateIso)
    }
    return true
  }

  /**
   * The event for a delivery no later run will finish, or null. IN_PROGRESS
   * is another worker's, and DISABLED or QUARANTINED send nothing by design.
   * A thrown call (`result` null) recorded its outcome on the row before
   * rethrowing, so the row is read.
   *
   * The read is on its own pool connection (`transaction: null`), and the
   * fault that made the call throw (a pool timeout, a DB blip) will often
   * fail it too. That is caught here, per company, like the call itself: no
   * event this run, and the next run reads the row again. Letting it out
   * would abort the run and roll back every SENT event already written.
   */
  private async stoppedEventType(
    kind: DeadlineKind,
    result: DeliverToMailboxResult | null,
    idempotencyKey: string,
    meta: Record<string, unknown>,
  ): Promise<CompanyDeadlineReminderEventType | null> {
    if (result) {
      if (result.status === 'UNCERTAIN') {
        return kind.unconfirmedEventType
      }
      if ('skipped' in result && result.skipped === 'ATTEMPTS_EXHAUSTED') {
        return kind.undeliveredEventType
      }
      return null
    }

    let delivery: MailboxDeliveryState | null
    try {
      delivery = await this.mailboxDeliveryService.findDelivery(idempotencyKey)
    } catch (error) {
      this.logger.error(
        `Could not read back mailbox delivery ${idempotencyKey} after it failed — the next run reads it again`,
        {
          ...meta,
          message: error instanceof Error ? error.message : String(error),
        },
      )
      return null
    }
    if (!delivery) {
      return null
    }
    // `interrupted` only when recording the failure itself failed: a call
    // that throws clears its in-flight marker before rethrowing.
    if (
      delivery.status === MailboxDeliveryStatusEnum.UNCERTAIN ||
      delivery.interrupted
    ) {
      return kind.unconfirmedEventType
    }
    return delivery.exhausted ? kind.undeliveredEventType : null
  }

  /**
   * Records an UNDELIVERED or UNCONFIRMED event on the company timeline,
   * deduped per (tier, due date) like `flagMissingEmail`, so the gap shows
   * once per cycle, not once per run.
   */
  private async flagStopped(
    company: CompanyModel,
    eventType: CompanyDeadlineReminderEventType,
    tier: CompanyReminderTierEnum,
    dueDateIso: string,
  ): Promise<void> {
    const alreadyFlagged =
      await this.companyEventService.hasDeadlineReminderEvent(
        company.id,
        eventType,
        tier,
        dueDateIso,
      )
    if (alreadyFlagged) return

    await this.companyEventService.emitDeadlineReminderEvent(
      company.id,
      company.status,
      eventType,
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
