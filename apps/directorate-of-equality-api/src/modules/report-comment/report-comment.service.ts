import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { IDoeMailService } from '../mail/doe-mail.service.interface'
import {
  CommunicationStatusEnum,
  ReportModel,
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

    const isOpen =
      report.communicationStatus === CommunicationStatusEnum.OPEN ||
      report.communicationStatus ===
        CommunicationStatusEnum.AWAITING_RESPONSE ||
      report.communicationStatus === CommunicationStatusEnum.RESPONSE_RECEIVED

    // External comments (from either side) require an open thread. Opening is an
    // explicit reviewer action — an external comment never opens a NOT_STARTED /
    // CLOSED thread. Reviewer INTERNAL notes are exempt (see DRAFT guard above).
    if (visibility === CommentVisibilityEnum.EXTERNAL && !isOpen) {
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

    // Move the directional sub-state. The applicant answering flips the thread
    // to RESPONSE_RECEIVED (surfaces the overview "Beðið svara" icon); a reviewer
    // reply on an already-open thread flips it back to AWAITING_RESPONSE. A
    // reviewer comment does NOT open a NOT_STARTED / CLOSED thread — opening is
    // an explicit action (see ReportWorkflowService.openCommunication).
    if (!isReviewer) {
      if (report.communicationStatus !== CommunicationStatusEnum.RESPONSE_RECEIVED) {
        await report.update({
          communicationStatus: CommunicationStatusEnum.RESPONSE_RECEIVED,
        })
      }
    } else if (
      visibility === CommentVisibilityEnum.EXTERNAL &&
      isOpen &&
      report.communicationStatus !== CommunicationStatusEnum.AWAITING_RESPONSE
    ) {
      await report.update({
        communicationStatus: CommunicationStatusEnum.AWAITING_RESPONSE,
      })
    }

    if (isReviewer && visibility === CommentVisibilityEnum.EXTERNAL) {
      await this.mailService.sendExternalCommentNotification(report, comment)
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
}
