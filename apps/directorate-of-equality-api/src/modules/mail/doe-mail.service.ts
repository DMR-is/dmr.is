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
import { IDoeMailService } from './doe-mail.service.interface'

const LOGGING_CONTEXT = 'DoeMailService'
const FALLBACK_FROM_ADDRESS = 'noreply@jafnretti.is'
const FROM_DISPLAY_NAME = 'Jafnréttisstofa'

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
    const to = report.contactEmail ?? report.companyAdminEmail

    if (!to) {
      this.logger.warn(
        'Skipping external comment email — report has no contact or admin email',
        {
          reportId: report.id,
          commentId: comment.id,
          context: LOGGING_CONTEXT,
        },
      )
      return
    }

    const fromAddress =
      process.env.SEND_FROM_EMAIL_ADDRESS ?? FALLBACK_FROM_ADDRESS

    const message = {
      from: `${FROM_DISPLAY_NAME} <${fromAddress}>`,
      to,
      replyTo: fromAddress,
      subject: buildExternalCommentSubject(report),
      text: buildExternalCommentText(report, comment),
      html: buildExternalCommentHtml(report, comment),
    }

    try {
      await this.aws.sendMail(message, LOGGING_CONTEXT)
      this.logger.info('Sent external comment notification', {
        reportId: report.id,
        commentId: comment.id,
        context: LOGGING_CONTEXT,
      })
    } catch (error) {
      this.logger.error('Failed to send external comment notification', {
        error,
        reportId: report.id,
        commentId: comment.id,
        context: LOGGING_CONTEXT,
      })
    }
  }
}
