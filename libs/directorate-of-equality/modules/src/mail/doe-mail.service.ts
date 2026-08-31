import { Inject, Injectable } from '@nestjs/common'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { IAWSService } from '@dmr.is/shared-modules'

import { ReportModel } from '../report/models/report.model'
import { ReportCommentModel } from '../report-comment/models/report-comment.model'
import {
  buildExternalCommentHtml,
  buildExternalCommentSubject,
  buildExternalCommentText,
} from './templates/external-comment.template'
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
import { IDoeMailService } from './doe-mail.service.interface'

const LOGGING_CONTEXT = 'DoeMailService'
const FALLBACK_FROM_ADDRESS = 'noreply@jafnretti.is'
const FROM_DISPLAY_NAME = 'Jafnréttisstofa'

/** The rendered parts of one message, minus envelope and recipient. */
type MailContent = {
  subject: string
  text: string
  html: string
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

    // Intentionally not caught — the reminder task only records the event as
    // sent when this resolves, so a failed send is retried on the next run.
    // This is why the reminder does NOT go through `sendReportMail`, which
    // swallows by design.
    await this.aws.sendMail(message, LOGGING_CONTEXT)

    this.logger.info('Sent report deadline reminder', {
      to,
      reportType: input.reportType,
      context: LOGGING_CONTEXT,
    })
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
   */
  private async sendReportMail(
    report: ReportModel,
    content: MailContent,
    kind: string,
    logFields: Record<string, unknown>,
  ): Promise<void> {
    const to = report.contactEmail ?? report.companyAdminEmail

    if (!to) {
      this.logger.warn(
        `Skipping ${kind} email — report has no contact or admin email`,
        { ...logFields, context: LOGGING_CONTEXT },
      )
      return
    }

    try {
      await this.aws.sendMail(
        { ...this.envelope(), to, ...content },
        LOGGING_CONTEXT,
      )
      this.logger.info(`Sent ${kind}`, {
        ...logFields,
        context: LOGGING_CONTEXT,
      })
    } catch (error) {
      this.logger.error(`Failed to send ${kind}`, {
        error,
        ...logFields,
        context: LOGGING_CONTEXT,
      })
    }
  }
}
