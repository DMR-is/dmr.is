import { ReportModel } from '../report/models/report.model'
import { ReportCommentModel } from '../report-comment/models/report-comment.model'
import { ReportDeadlineReminderInput } from './templates/report-deadline-reminder.template'

export interface IDoeMailService {
  sendExternalCommentNotification(
    report: ReportModel,
    comment: ReportCommentModel,
  ): Promise<void>

  /**
   * Notifies the company that its report was denied, with the reviewer's
   * `denialReason` as the body.
   *
   * Best-effort like the comment notification: the denial is already committed
   * and event-logged by the time this is called, so a failed send is logged and
   * swallowed rather than surfaced to the reviewer.
   */
  sendReportDenied(report: ReportModel, denialReason: string): Promise<void>

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
