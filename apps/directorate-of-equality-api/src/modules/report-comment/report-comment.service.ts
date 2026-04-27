import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import {
  ReportResourceActorKindEnum,
  type ReportResourceContext,
} from '../report/types/report-resource-context'
import { CreateReportCommentDto } from './dto/create-report-comment.dto'
import { ReportCommentDto } from './dto/report-comment.dto'
import {
  CommentVisibilityEnum,
  ReportCommentModel,
} from './models/report-comment.model'
import { CommentAuthorKindEnum } from './types/report-comment-context'
import { IReportCommentService } from './report-comment.service.interface'

const LOGGING_CONTEXT = 'ReportCommentService'

@Injectable()
export class ReportCommentService implements IReportCommentService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @InjectModel(ReportCommentModel)
    private readonly reportCommentModel: typeof ReportCommentModel,
  ) {}

  async getByReportId(
    context: ReportResourceContext,
  ): Promise<ReportCommentDto[]> {
    this.logger.debug(`Getting comments for report ${context.reportId}`, {
      context: LOGGING_CONTEXT,
    })

    const comments = await this.reportCommentModel.findAll({
      where:
        context.actor.kind === ReportResourceActorKindEnum.REVIEWER
          ? { reportId: context.reportId }
          : {
              reportId: context.reportId,
              visibility: CommentVisibilityEnum.EXTERNAL,
            },
      order: [['createdAt', 'ASC']],
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
      context.actor.kind !== ReportResourceActorKindEnum.REVIEWER &&
      dto.visibility !== CommentVisibilityEnum.EXTERNAL
    ) {
      throw new ForbiddenException(
        'Company admins may only create external comments',
      )
    }

    const comment = await this.reportCommentModel.create({
      reportId: context.reportId,
      authorKind:
        context.actor.kind === ReportResourceActorKindEnum.REVIEWER
          ? CommentAuthorKindEnum.REVIEWER
          : CommentAuthorKindEnum.COMPANY_ADMIN,
      authorUserId:
        context.actor.kind === ReportResourceActorKindEnum.REVIEWER
          ? context.actor.userId
          : null,
      visibility:
        context.actor.kind !== ReportResourceActorKindEnum.REVIEWER
          ? CommentVisibilityEnum.EXTERNAL
          : dto.visibility,
      body,
      reportStatus: context.reportStatus,
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
      context.actor.kind === ReportResourceActorKindEnum.REVIEWER &&
      (comment.authorKind !== CommentAuthorKindEnum.REVIEWER ||
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
      context.actor.kind !== ReportResourceActorKindEnum.REVIEWER &&
      comment.authorKind !== CommentAuthorKindEnum.COMPANY_ADMIN
    ) {
      throw new ForbiddenException(
        'Company admins may only delete their own comments',
      )
    }

    await comment.destroy()
  }
}
