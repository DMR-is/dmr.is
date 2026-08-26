import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { IApplicationSystemService } from '../application-system/application-system.service.interface'
import { IDoeMailService } from '../mail/doe-mail.service.interface'
import {
  CommunicationStatusEnum,
  ReportModel,
  ReportProviderEnum,
  ReportStatusEnum,
} from '../report/models/report.model'
import {
  type ReportResourceContext,
  ReportRoleEnum,
} from '../report/types/report-resource-context'
import { UserModel } from '../user/models/user.model'
import { CreateReportCommentDto } from './dto/create-report-comment.dto'
import { ReportCommentDto } from './dto/report-comment.dto'
import {
  CommentVisibilityEnum,
  ReportCommentModel,
} from './models/report-comment.model'
import { IReportCommentService } from './report-comment.service.interface'

const LOGGING_CONTEXT = 'ReportCommentService'

@Injectable()
export class ReportCommentService implements IReportCommentService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @InjectModel(ReportCommentModel)
    private readonly reportCommentModel: typeof ReportCommentModel,
    @InjectModel(ReportModel)
    private readonly reportModel: typeof ReportModel,
    @Inject(IDoeMailService)
    private readonly mailService: IDoeMailService,
    @Inject(IApplicationSystemService)
    private readonly applicationSystemService: IApplicationSystemService,
  ) {}

  async getByReportId(
    context: ReportResourceContext,
  ): Promise<ReportCommentDto[]> {
    this.logger.debug(`Getting comments for report ${context.reportId}`, {
      context: LOGGING_CONTEXT,
    })

    const comments = await this.reportCommentModel.findAll({
      where:
        context.actor.kind === ReportRoleEnum.REVIEWER
          ? { reportId: context.reportId }
          : {
              reportId: context.reportId,
              visibility: CommentVisibilityEnum.EXTERNAL,
            },
      order: [['createdAt', 'ASC']],
      include: [{ model: UserModel, as: 'author', required: false }],
    })

    return comments.map((comment) => comment.fromModel())
  }

  /**
   * The one way a comment lands on a report — and, for a reviewer's EXTERNAL
   * comment, the one way a report is sent back for changes.
   *
   * A reviewer marking a comment visible to the applicant IS the change
   * request: there is nothing else it could mean. So that single call posts the
   * comment, moves the thread to AWAITING_RESPONSE, and drives the island.is
   * application into edit state — the last only on the comment that actually
   * makes that move, so a follow-up sent before the applicant replies stays a
   * message rather than a second change request.
   * There is no separate "send to edit" action and no explicit open/close of
   * the thread — the admin writes one comment and ticks one box.
   *
   * A reviewer's INTERNAL note is just a note: no status move, no outbound
   * notification, invisible to the applicant.
   */
  async create(
    context: ReportResourceContext,
    dto: CreateReportCommentDto,
  ): Promise<ReportCommentDto> {
    this.logger.info(`Creating comment for report ${context.reportId}`, {
      context: LOGGING_CONTEXT,
    })

    const body = dto.body.trim()

    if (!body) {
      throw new BadRequestException('Comment body cannot be empty')
    }

    if (
      context.actor.kind !== ReportRoleEnum.REVIEWER &&
      dto.visibility !== CommentVisibilityEnum.EXTERNAL
    ) {
      throw new ForbiddenException(
        'Company admins may only create external comments',
      )
    }

    const isReviewer = context.actor.kind === ReportRoleEnum.REVIEWER

    const visibility = isReviewer
      ? dto.visibility
      : CommentVisibilityEnum.EXTERNAL

    const report = await this.reportModel.findByPk(context.reportId)
    if (!report) {
      throw new NotFoundException(`Report "${context.reportId}" not found`)
    }

    // Reviewers may leave internal notes on any report they can see, but never
    // on a DRAFT — a draft has not been submitted, so there is nothing to
    // review yet. (Drafts are not surfaced to reviewers today; this is a guard.)
    if (
      isReviewer &&
      visibility === CommentVisibilityEnum.INTERNAL &&
      context.reportStatus === ReportStatusEnum.DRAFT
    ) {
      throw new ForbiddenException(
        'Internal comments are not allowed on a draft report',
      )
    }

    // Messaging the applicant reopens their island.is application, so it is
    // only possible while the report is actually under review.
    if (isReviewer && visibility === CommentVisibilityEnum.EXTERNAL) {
      if (context.reportStatus !== ReportStatusEnum.IN_REVIEW) {
        throw new BadRequestException(
          `Cannot message the applicant on a report with status ${context.reportStatus}`,
        )
      }
    }

    // The applicant may only reply into a thread the reviewer has started, and
    // only while it is still live (a concluded review is CLOSED).
    if (!isReviewer && !this.isCommunicationOpen(report.communicationStatus)) {
      throw new ForbiddenException('Communication is not open on this report')
    }

    const comment = await this.reportCommentModel.create({
      reportId: context.reportId,
      authorKind: isReviewer ? ReportRoleEnum.REVIEWER : ReportRoleEnum.COMPANY,
      authorUserId:
        context.actor.kind === ReportRoleEnum.REVIEWER
          ? context.actor.userId
          : null,
      visibility,
      body,
      reportStatus: context.reportStatus,
    })

    // Move the thread to whoever now owes an answer. Silent — the comment row
    // itself is the audit trail, so these transitions emit no event.
    const previousStatus = report.communicationStatus
    const nextStatus = !isReviewer
      ? CommunicationStatusEnum.RESPONSE_RECEIVED
      : visibility === CommentVisibilityEnum.EXTERNAL
        ? CommunicationStatusEnum.AWAITING_RESPONSE
        : null

    if (nextStatus && previousStatus !== nextStatus) {
      await report.update({ communicationStatus: nextStatus })
    }

    const isExternalFromReviewer =
      isReviewer && visibility === CommentVisibilityEnum.EXTERNAL

    // Only the comment that actually *moves* the thread into AWAITING_RESPONSE
    // is a change request. A reviewer following up before the applicant has
    // replied is a second message on a conversation already handed over: the
    // island.is application is still open for editing, so re-driving it would
    // add nothing but a duplicate "sent for changes" row on the timeline and a
    // redundant EDIT the far-side state machine may well reject.
    const isChangeRequest =
      isExternalFromReviewer &&
      previousStatus !== CommunicationStatusEnum.AWAITING_RESPONSE

    // No EDITED event here. The reviewer is *requesting* changes, not making
    // them — "gerði breytingar á skýrslu" against their name read as the
    // opposite of what happened — and the row carried no information either:
    // an external comment from a reviewer IS the change request, so the comment
    // itself already records it. EDITED stays for the two places the applicant
    // genuinely edits (`editEqualityContent`, `editOutliers`), where the label
    // is true and is the only audit signal that they responded.
    //
    // Every DB write the request makes lands before the outbound calls below.
    // The request runs inside one CLS transaction (`CLSMiddleware` is applied
    // to all routes and rolls it back on a non-2xx response), so a throw here
    // takes the comment and the status move with it — but nothing recalls an
    // email or an island.is application already reopened.
    if (isExternalFromReviewer) {
      // Mail is not gated on the transition: a follow-up message is still a
      // message the applicant should hear about.
      await this.mailService.sendExternalCommentNotification(report, comment)
    }

    if (isChangeRequest) {
      await this.notifyApplicationSystemEdited(report)
    }

    // Reload with the author so the response carries authorName (the freshly
    // created instance has no association loaded).
    await comment.reload({
      include: [{ model: UserModel, as: 'author', required: false }],
    })

    return comment.fromModel()
  }

  async delete(
    context: ReportResourceContext,
    commentId: string,
  ): Promise<void> {
    this.logger.info(
      `Deleting comment ${commentId} for report ${context.reportId}`,
      {
        context: LOGGING_CONTEXT,
      },
    )

    const comment = await this.reportCommentModel.findOneOrThrow({
      where: { id: commentId, reportId: context.reportId },
    })

    if (
      context.actor.kind === ReportRoleEnum.REVIEWER &&
      (comment.authorKind !== ReportRoleEnum.REVIEWER ||
        comment.authorUserId !== context.actor.userId)
    ) {
      throw new ForbiddenException(
        'Reviewers may only delete their own comments',
      )
    }

    // Company-side authorship is modeled at the report level rather than the
    // individual person level, so the authenticated reporting company may
    // delete company-authored comments on its own report.
    if (
      context.actor.kind !== ReportRoleEnum.REVIEWER &&
      comment.authorKind !== ReportRoleEnum.COMPANY
    ) {
      throw new ForbiddenException(
        'Company admins may only delete their own comments',
      )
    }

    await comment.destroy()
  }

  private isCommunicationOpen(status: CommunicationStatusEnum): boolean {
    return (
      status === CommunicationStatusEnum.AWAITING_RESPONSE ||
      status === CommunicationStatusEnum.RESPONSE_RECEIVED
    )
  }

  /**
   * Best-effort outbound notification that the applicant should edit and
   * resubmit. Only island.is-sourced reports have an application to update, and
   * a failed outbound call must not fail the reviewer's comment: the comment
   * and the status move are both written by this point, and letting island.is
   * roll them back would lose the reviewer's message over an outage on someone
   * else's service.
   */
  private async notifyApplicationSystemEdited(
    report: ReportModel,
  ): Promise<void> {
    if (
      report.providerType !== ReportProviderEnum.ISLAND_IS ||
      !report.providerId
    ) {
      return
    }

    try {
      await this.applicationSystemService.notifyEdited(report.providerId)
    } catch (error) {
      this.logger.error(
        `Failed to notify application system (edit) for report ${report.id}`,
        {
          context: LOGGING_CONTEXT,
          applicationId: report.providerId,
          message: error instanceof Error ? error.message : String(error),
        },
      )
    }
  }
}
