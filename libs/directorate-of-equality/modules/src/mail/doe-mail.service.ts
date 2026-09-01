import { Inject, Injectable } from '@nestjs/common'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { IAWSService } from '@dmr.is/shared-modules'
import { ResultWrapper } from '@dmr.is/types'

import { ReportModel } from '../report/models/report.model'
import { ReportCommentModel } from '../report-comment/models/report-comment.model'
import {
  buildExternalCommentHtml,
  buildExternalCommentSubject,
  buildExternalCommentText,
} from './templates/external-comment.template'
import {
  buildReportApprovedHtml,
  buildReportApprovedSubject,
  buildReportApprovedText,
} from './templates/report-approved.template'
import {
  buildReportDeadlineReminderHtml,
  buildReportDeadlineReminderSubject,
  buildReportDeadlineReminderText,
  ReportDeadlineReminderInput,
} from './templates/report-deadline-reminder.template'
import {
  buildReportDeniedHtml,
  buildReportDeniedSubject,
  buildReportDeniedText,
} from './templates/report-denied.template'
import {
  IDoeMailService,
  ReportMailAttachment,
} from './doe-mail.service.interface'
import { MailSendError } from './mail-send.error'

const LOGGING_CONTEXT = 'DoeMailService'
const FALLBACK_FROM_ADDRESS = 'noreply@jafnretti.is'
const FROM_DISPLAY_NAME = 'Jafnréttisstofa'

/** The rendered parts of one message, minus envelope and recipient. */
type MailContent = {
  subject: string
  text: string
  html: string
  attachments?: { filename: string; content: Buffer }[]
}

@Injectable()
export class DoeMailService implements IDoeMailService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(IAWSService) private readonly aws: IAWSService,
  ) {}

  async sendExternalCommentNotification(
    report: ReportModel,
    comment: ReportCommentModel,
  ): Promise<void> {
    await this.sendReportMail(
      report,
      {
        subject: buildExternalCommentSubject(report),
        text: buildExternalCommentText(report, comment),
        html: buildExternalCommentHtml(report, comment),
      },
      'external comment notification',
      { reportId: report.id, commentId: comment.id },
    )
  }

  async sendReportDenied(
    report: ReportModel,
    denialReason: string,
  ): Promise<void> {
    await this.sendReportMail(
      report,
      {
        subject: buildReportDeniedSubject(report),
        text: buildReportDeniedText(report, denialReason),
        html: buildReportDeniedHtml(report, denialReason),
      },
      'report denied notification',
      { reportId: report.id, reportType: report.type },
    )
  }

  async sendReportApproved(
    report: ReportModel,
    attachments: ReportMailAttachment[],
  ): Promise<boolean> {
    const labels = attachments.map((attachment) => attachment.label)

    return this.sendReportMail(
      report,
      {
        subject: buildReportApprovedSubject(report),
        text: buildReportApprovedText(report, labels),
        html: buildReportApprovedHtml(report, labels),
        attachments: attachments.map(({ filename, content }) => ({
          filename,
          content,
        })),
      },
      'report approved notification',
      {
        reportId: report.id,
        reportType: report.type,
        attachmentCount: attachments.length,
      },
    )
  }

  async sendReportDeadlineReminder(
    to: string,
    input: ReportDeadlineReminderInput,
  ): Promise<void> {
    const message = {
      ...this.envelope(),
      to,
      subject: buildReportDeadlineReminderSubject(input),
      text: buildReportDeadlineReminderText(input),
      html: buildReportDeadlineReminderHtml(input),
    }

    /*
     * ⚠️ Throws on an err RESULT, because `sendMail` does not reject.
     *
     * It is decorated `@LogAndHandle()`, whose catch *returns*
     * `handleException(...)` — which yields `ResultWrapper.err` and never
     * rethrows. So `await`ing it and relying on a rejection was wrong: a hard
     * SES failure resolved, this method returned normally, and the reminder task
     * recorded the event as SENT. The company then never got that tier's
     * reminder and it was never retried, which is the precise opposite of what
     * the previous comment here claimed.
     *
     * The task's contract is unchanged — a throw means "not sent, retry next
     * run" — so the failure is converted into one here.
     */
    const sent = await this.sendMailResult(message)

    if (sent.result.ok === false) {
      // ⚠️ `MailSendError`, not a bare Error — the task's catch keys on the type
      // to tell a bad recipient from a database fault it must not swallow. See
      // `mail-send.error.ts`.
      throw new MailSendError(
        `Failed to send report deadline reminder: ${sent.result.error.message}`,
      )
    }

    this.logger.info('Sent report deadline reminder', {
      to,
      reportType: input.reportType,
      context: LOGGING_CONTEXT,
    })
  }

  /**
   * The one place this lib takes `IAWSService.sendMail` at its word about what
   * a failure looks like.
   *
   * ⚠️ **It resolves an err result — it does NOT reject.** The implementation
   * is decorated `@LogAndHandle()`, whose catch *returns* `handleException(...)`,
   * and `handleException` yields `ResultWrapper.err` on every branch without
   * rethrowing. Confirmed by executing a decorated method, not by reading it.
   *
   * The declared return type is a bare `SentMessageInfo`, which
   * `@types/nodemailer` defines as `any` — so it reads as "this throws on
   * failure" and type-checks either way. That is precisely the bug it produced:
   * a `try/catch` around the call is unreachable, and a hard SES failure looks
   * like a successful send.
   *
   * Correcting the declaration is the real fix, but `sendMail` is shared with
   * the Official Journal and the Legal Gazette, both of which have the same dead
   * catch — so it is a cross-product change with its own blast radius and does
   * not belong in this PR. This narrows it at DoE's boundary instead, in one
   * place, so no caller in this lib repeats the assertion.
   */
  private async sendMailResult(
    message: Parameters<IAWSService['sendMail']>[0],
  ): Promise<ResultWrapper<unknown>> {
    return (await this.aws.sendMail(
      message,
      LOGGING_CONTEXT,
    )) as ResultWrapper<unknown>
  }

  /**
   * From/reply-to for every message this service sends. Read at call time
   * rather than construction so the address is testable and a restart is the
   * only thing needed to change it.
   */
  private envelope(): { from: string; replyTo: string } {
    const fromAddress =
      process.env.SEND_FROM_EMAIL_ADDRESS ?? FALLBACK_FROM_ADDRESS

    return {
      from: `${FROM_DISPLAY_NAME} <${fromAddress}>`,
      replyTo: fromAddress,
    }
  }

  /**
   * Sends a message addressed to whoever the *report* names, best-effort.
   *
   * Recipient is `contactEmail` falling back to `companyAdminEmail` — the two
   * people the submission itself nominated. Deliberately not `company.email`,
   * which the deadline reminder uses: that mail is about the company's
   * obligations in general, these are about one submission, and the person who
   * filed it is the one who can act on them.
   *
   * ⚠️ **Never throws.** Every caller is a request that has already committed
   * its state change — a comment written, a report denied — so a failed send
   * must not surface as an error and undo work that stands. The failure is
   * logged and swallowed. Callers that need the opposite (a send whose failure
   * must be visible so the work can be retried) must not use this helper; see
   * `sendReportDeadlineReminder`.
   *
   * Returns whether it was delivered, so a caller with a *consequence* of the
   * send — the approval's S3 archive — can tell. Callers with none ignore it.
   */
  private async sendReportMail(
    report: ReportModel,
    content: MailContent,
    kind: string,
    logFields: Record<string, unknown>,
  ): Promise<boolean> {
    /*
     * ⚠️ Not `??`, and not "first truthy" either.
     *
     * `contactEmail` is `@ApiString()` — `IsString()` alone, no `@IsEmail`, no
     * `MinLength` — so anything a submitter types is stored, `''` included. `??`
     * coalesces only null/undefined, so an empty contact email skipped the notice
     * entirely while a perfectly good `companyAdminEmail` sat beside it.
     *
     * First truthy fixed that and left the wider half: a typo'd
     * `jon.example.is` is truthy, so it won the fallback and the send failed
     * against an address that was never going to work. That is a live path now
     * that this field carries the approval PDFs and not just a comment notice, so
     * a candidate has to at least look like an address to be preferred.
     *
     * `includes('@')` deliberately, not an email regex: the job here is to pick
     * between two stored values, not to validate one. SES is the authority on
     * deliverability and it rejects with a logged err result. Tightening the DTO
     * to `@IsEmail()` is the real fix and is a change to the submission contract
     * — every provider channel, and whatever is already in the column — so it
     * belongs to its own PR, not to this one.
     */
    const to = [report.contactEmail, report.companyAdminEmail]
      .map((candidate) => candidate?.trim())
      .find((candidate) => !!candidate && candidate.includes('@'))

    if (!to) {
      this.logger.warn(
        `Skipping ${kind} email — report has no usable contact or admin email`,
        { ...logFields, context: LOGGING_CONTEXT },
      )
      return false
    }

    try {
      const sent = await this.sendMailResult({
        ...this.envelope(),
        to,
        ...content,
      })

      /*
       * ⚠️ **The result, not a rejection.** `sendMail` is decorated
       * `@LogAndHandle()`, so its catch returns `ResultWrapper.err` rather than
       * rethrowing — it cannot reject. Relying on the `catch` below meant a hard
       * SES failure fell straight through to `logger.info('Sent ...')`: a report
       * approved, its notice and both PDFs undelivered, and the only trace a log
       * line claiming success.
       *
       * `CompanyFileService` branches on `uploadObject`'s result the same way;
       * this path simply did not.
       */
      if (sent.result.ok === false) {
        this.logger.error(`Failed to send ${kind}`, {
          ...logFields,
          context: LOGGING_CONTEXT,
          errorCode: sent.result.error.code,
          errorMessage: sent.result.error.message,
        })
        return false
      }

      this.logger.info(`Sent ${kind}`, {
        ...logFields,
        context: LOGGING_CONTEXT,
      })
      return true
    } catch (error) {
      // Retained for a throw the decorator cannot intercept — building the
      // message, or a future undecorated implementation. `message` is extracted
      // rather than logging the raw Error: production formats with
      // `format.json()`, and an Error has no enumerable own properties, so it
      // serializes to `{}`.
      this.logger.error(`Failed to send ${kind}`, {
        ...logFields,
        context: LOGGING_CONTEXT,
        errorMessage: error instanceof Error ? error.message : String(error),
      })
      return false
    }
  }
}
