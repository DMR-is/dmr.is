import { Op, WhereOptions } from 'sequelize'

import { Inject, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { CompanyStatusEnum } from '../../modules/company/models/company.enums'
import { CompanyModel } from '../../modules/company/models/company.model'
import {
  CompanyDeadlineReminderEventType,
  CompanyEventTypeEnum,
  CompanyReminderTierEnum,
} from '../../modules/company/models/company-event.model'
import { ICompanyEventService } from '../../modules/company-event/company-event.service.interface'
import { IDoeMailService } from '../../modules/mail/doe-mail.service.interface'
import { ReportTypeEnum } from '../../modules/report/models/report.enums'
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
      await this.remindCompany(company, kind, tier.tier)
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

    const to = company.email
    if (!to) {
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
   * company with no email gets one event per tier per cycle, not one per run.
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
      `Tried to send ${kind.reportType} ${tier} reminder for company ${company.id} but no email is on file`,
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
