import { ReportModel } from '../report/models/report.model'
import { ReportCommentModel } from '../report-comment/models/report-comment.model'
import { ReportDeadlineReminderInput } from './templates/report-deadline-reminder.template'

export interface IDoeMailService {
  sendExternalCommentNotification(
    report: ReportModel,
    comment: ReportCommentModel,
  ): Promise<void>

  /**
   * Sends a 6-months-before reminder for an upcoming report deadline.
   * Throws on send failure so the caller can decide whether to record the
   * reminder as sent.
   */
  sendReportDeadlineReminder(
    to: string,
    input: ReportDeadlineReminderInput,
  ): Promise<void>
}

export const IDoeMailService = Symbol('IDoeMailService')
