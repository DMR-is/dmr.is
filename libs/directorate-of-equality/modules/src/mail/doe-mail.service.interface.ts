import { ReportModel } from '../report/models/report.model'
import { ReportCommentModel } from '../report-comment/models/report-comment.model'
import { ReportDeadlineReminderInput } from './templates/report-deadline-reminder.template'

/**
 * One document attached to an outbound message.
 *
 * `label` is Icelandic prose, not the file name: the body lists what is attached
 * so a reader with two PDFs can tell which is which, and "úrbótaáætlun" reads
 * better there than "urbotaaetlun-<uuid>.pdf".
 *
 * The mail module deliberately does not know how to *produce* these. Callers
 * hand it finished buffers, which keeps `IDoeMailService` free of a dependency
 * on `IReportPdfService` (and puppeteer) for the messages that carry no
 * documents at all.
 */
export type ReportMailAttachment = {
  filename: string
  content: Buffer
  label: string
}

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
   * Notifies the company that its report was approved, attaching the documents
   * the approval produced — the report PDF, plus the úrbótaáætlun PDF for a
   * salary report.
   *
   * Best-effort, for the same reason as `sendReportDenied`: the approval is
   * committed before this runs, so a failed send is logged rather than thrown.
   *
   * ⚠️ **Returns whether it was delivered**, which the others do not, because
   * this one has a consequence: the caller archives the same attachments to S3
   * as the Directorate's record of what the company received. Archiving a send
   * that never happened puts a false yes in front of an auditor.
   */
  sendReportApproved(
    report: ReportModel,
    attachments: ReportMailAttachment[],
  ): Promise<boolean>

  /**
   * Sends a 6-months-before reminder for an upcoming report deadline.
   * Throws on send failure so the caller can decide whether to record the
   * reminder as sent.
   */
  sendReportDeadlineReminder(
    to: string,
    input: ReportDeadlineReminderInput,
  ): Promise<void>

  /**
   * Sends one admin-authored message to one address.
   *
   * Routed through `IDoeMailService` rather than SES directly so a custom mail
   * arrives from the same `Jafnréttisstofa <…>` sender as the approval notice.
   *
   * `bodyHtml` must already be sanitised — the caller stores the body it
   * previews and sends, and sanitising in both places is how the stored and
   * delivered copies start to differ.
   *
   * Returns the outcome and never throws for a send failure, unlike the report
   * notices: this failure has somewhere to go — one recipient row, which records
   * the error and lets the rest of the batch continue.
   */
  sendCustomEmail(
    to: string,
    subject: string,
    bodyHtml: string,
    attachments?: ReportMailAttachment[],
  ): Promise<CustomEmailSendResult>
}

/** Outcome of one custom-email send. `error` is for the recipient row, not the reader. */
export type CustomEmailSendResult =
  | { ok: true }
  | { ok: false; error: string }

export const IDoeMailService = Symbol('IDoeMailService')
