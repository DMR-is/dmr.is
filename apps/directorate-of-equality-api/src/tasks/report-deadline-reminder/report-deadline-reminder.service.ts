import { Op } from 'sequelize'

import { Inject, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { CompanyStatusEnum } from '../../modules/company/models/company.enums'
import { CompanyModel } from '../../modules/company/models/company.model'
import {
  CompanyDeadlineReminderEventType,
  CompanyEventTypeEnum,
} from '../../modules/company/models/company-event.model'
import { CompanyReportModel } from '../../modules/company/models/company-report.model'
import { ICompanyEventService } from '../../modules/company-event/company-event.service.interface'
import { IDoeMailService } from '../../modules/mail/doe-mail.service.interface'
import {
  ReportStatusEnum,
  ReportTypeEnum,
} from '../../modules/report/models/report.enums'
import { ReportModel } from '../../modules/report/models/report.model'
import {
  REPORT_DEADLINE_REMINDER_LOGGING_CONTEXT,
  REPORT_DEADLINE_REMINDER_MONTHS,
} from '../constants'
import { IReportDeadlineReminderService } from './report-deadline-reminder.service.interface'

const LOGGING_CONTEXT = REPORT_DEADLINE_REMINDER_LOGGING_CONTEXT

/** One row of the deadline matrix the task walks — equality and salary. */
type DeadlineKind = {
  /** Company column holding the due date. */
  dueField: 'nextEqualityReportDueAt' | 'nextSalaryReportDueAt'
  reportType: ReportTypeEnum
  eventType: CompanyDeadlineReminderEventType
}

const DEADLINE_KINDS: DeadlineKind[] = [
  {
    dueField: 'nextEqualityReportDueAt',
    reportType: ReportTypeEnum.EQUALITY,
    eventType: CompanyEventTypeEnum.EQUALITY_REPORT_DEADLINE_REMINDER_SENT,
  },
  {
    dueField: 'nextSalaryReportDueAt',
    reportType: ReportTypeEnum.SALARY,
    eventType: CompanyEventTypeEnum.SALARY_REPORT_DEADLINE_REMINDER_SENT,
  },
]

const addMonths = (date: Date, months: number): Date => {
  const result = new Date(date)
  result.setMonth(result.getMonth() + months)
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
    @InjectModel(ReportModel)
    private readonly reportModel: typeof ReportModel,
    @Inject(ICompanyEventService)
    private readonly companyEventService: ICompanyEventService,
    @Inject(IDoeMailService)
    private readonly mailService: IDoeMailService,
  ) {}

  async run(): Promise<void> {
    const now = new Date()
    const windowEnd = addMonths(now, REPORT_DEADLINE_REMINDER_MONTHS)

    for (const kind of DEADLINE_KINDS) {
      await this.processKind(kind, now, windowEnd)
    }
  }

  private async processKind(
    kind: DeadlineKind,
    now: Date,
    windowEnd: Date,
  ): Promise<void> {
    // Active, non-quarantined companies whose deadline is still ahead but now
    // within the reminder window. `quarantined` is an admin halt switch — no
    // outbound activity for those companies (see PR #1321) — so they are
    // excluded at the query level. Dedup (per due date) happens per-company
    // below.
    const companies = await this.companyModel.findAll({
      where: {
        status: CompanyStatusEnum.ACTIVE,
        quarantined: false,
        [kind.dueField]: { [Op.gt]: now, [Op.lte]: windowEnd },
      },
    })

    this.logger.info(
      `Found ${companies.length} companies in reminder window for ${kind.reportType}`,
      { context: LOGGING_CONTEXT, reportType: kind.reportType },
    )

    for (const company of companies) {
      await this.remindCompany(company, kind)
    }
  }

  private async remindCompany(
    company: CompanyModel,
    kind: DeadlineKind,
  ): Promise<void> {
    const dueDate = company[kind.dueField]
    if (!dueDate) return

    const dueDateIso = dueDate.toISOString()

    const alreadySent =
      await this.companyEventService.hasDeadlineReminderBeenSent(
        company.id,
        kind.eventType,
        dueDateIso,
      )
    if (alreadySent) return

    const to = await this.resolveRecipientEmail(company.id)
    if (!to) {
      // No approved report with a contact email — nothing to notify. Logged so
      // it surfaces in Datadog for follow-up.
      this.logger.warn(
        `Skipping ${kind.reportType} reminder for company ${company.id} — no approved report with a contact email`,
        {
          context: LOGGING_CONTEXT,
          companyId: company.id,
          reportType: kind.reportType,
        },
      )
      return
    }

    await this.mailService.sendReportDeadlineReminder(to, {
      companyName: company.name,
      reportType: kind.reportType,
      dueDate,
    })

    // Only recorded after a successful send, so a failed send retries next run.
    await this.companyEventService.emitDeadlineReminderSent(
      company.id,
      company.status,
      kind.eventType,
      dueDateIso,
    )
  }

  /**
   * Recipient = contact email of the company's most recently approved report.
   * Reports link to a company via the parent `company_report` snapshot
   * (`parentCompanyId IS NULL`). Returns null when no such report exists.
   */
  private async resolveRecipientEmail(
    companyId: string,
  ): Promise<string | null> {
    const report = await this.reportModel.findOne({
      where: {
        status: ReportStatusEnum.APPROVED,
        contactEmail: { [Op.ne]: null },
      },
      include: [
        {
          model: CompanyReportModel,
          as: 'companyReport',
          required: true,
          where: { companyId, parentCompanyId: null },
        },
      ],
      order: [['approvedAt', 'DESC NULLS LAST']],
    })

    return report?.contactEmail ?? null
  }
}
