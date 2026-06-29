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
import { ICompanyEventService } from '../../modules/company-event/company-event.service.interface'
import { IDoeMailService } from '../../modules/mail/doe-mail.service.interface'
import { ReportTypeEnum } from '../../modules/report/models/report.enums'
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
  /** Event recorded once the reminder is sent. */
  sentEventType: CompanyDeadlineReminderEventType
  /** Event recorded when the reminder is due but no email is on file. */
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
      await this.companyEventService.hasDeadlineReminderEvent(
        company.id,
        kind.sentEventType,
        dueDateIso,
      )
    if (alreadySent) return

    const to = company.email
    if (!to) {
      await this.flagMissingEmail(company, kind, dueDateIso)
      return
    }

    await this.mailService.sendReportDeadlineReminder(to, {
      companyName: company.name,
      reportType: kind.reportType,
      dueDate,
    })

    // Only recorded after a successful send, so a failed send retries next run.
    await this.companyEventService.emitDeadlineReminderEvent(
      company.id,
      company.status,
      kind.sentEventType,
      dueDateIso,
    )
  }

  /**
   * Records a NO_EMAIL event on the company timeline so the gap is visible to
   * admins. Deduped per due date (same key as the sent event), so a company
   * with no email gets one event per cycle rather than one per daily run.
   */
  private async flagMissingEmail(
    company: CompanyModel,
    kind: DeadlineKind,
    dueDateIso: string,
  ): Promise<void> {
    const alreadyFlagged =
      await this.companyEventService.hasDeadlineReminderEvent(
        company.id,
        kind.noEmailEventType,
        dueDateIso,
      )
    if (alreadyFlagged) return

    this.logger.warn(
      `Tried to send ${kind.reportType} 6-month reminder for company ${company.id} but no email is on file`,
      {
        context: LOGGING_CONTEXT,
        companyId: company.id,
        reportType: kind.reportType,
      },
    )

    await this.companyEventService.emitDeadlineReminderEvent(
      company.id,
      company.status,
      kind.noEmailEventType,
      dueDateIso,
    )
  }
}
