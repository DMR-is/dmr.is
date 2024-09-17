import { Transaction } from 'sequelize'
import { Sequelize } from 'sequelize-typescript'
import { LogAndHandle, Transactional } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import {
  CaseCommentTitleEnum,
  GetCaseCommentResponse,
  GetCaseCommentsQuery,
  GetCaseCommentsResponse,
  PostCaseCommentBody,
} from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'
import { mapCommentTypeToTitle } from '@dmr.is/utils'

import {
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { IApplicationService } from '../application/application.service.interface'
import { CaseStatusModel } from '../case/models'
import { IUtilityService } from '../utility/utility.module'
import { caseCommentMigrate } from './migrations/case-comment.migrate'
import { CaseCommentModel } from './models/case-comment.model'
import { CaseCommentTaskModel } from './models/case-comment-task.model'
import { CaseCommentTitleModel } from './models/case-comment-title.model'
import { CaseCommentTypeModel } from './models/case-comment-type.model'
import { CaseCommentsModel } from './models/case-comments.model'
import { ICommentService } from './comment.service.interface'
import { getCaseCommentsRelations } from './relations'

@Injectable()
export class CommentService implements ICommentService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(forwardRef(() => IUtilityService))
    private utilityService: IUtilityService,

    @Inject(forwardRef(() => IApplicationService))
    private applicationService: IApplicationService,
    @InjectModel(CaseCommentsModel)
    private caseCommentsModel: typeof CaseCommentsModel,
    @InjectModel(CaseCommentModel)
    private caseCommentModel: typeof CaseCommentModel,

    @InjectModel(CaseCommentTaskModel)
    private caseCommentTaskModel: typeof CaseCommentTaskModel,

    @InjectModel(CaseCommentTitleModel)
    private caseCommentTitleModel: typeof CaseCommentTitleModel,

    @InjectModel(CaseCommentTypeModel)
    private caseCommentTypeModel: typeof CaseCommentTypeModel,

    private readonly sequelize: Sequelize,
  ) {
    this.logger.info('Using CaseCommentSerivce')
  }

  @LogAndHandle()
  @Transactional()
  private async caseCommentTitleLookup(
    type: string | CaseCommentTitleEnum,
    transaction?: Transaction,
  ): Promise<ResultWrapper<CaseCommentTitleModel>> {
    const title = await this.caseCommentTitleModel.findOne({
      where: { title: type },
      transaction,
    })

    if (!title) {
      throw new NotFoundException(`No title found for type<${type}>`)
    }

    return ResultWrapper.ok(title)
  }

  @LogAndHandle()
  @Transactional()
  private async caseCommentTypeLookup(
    type: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper<CaseCommentTypeModel>> {
    const commentType = await this.caseCommentTypeModel.findOne({
      where: { slug: type },
      transaction,
    })

    if (!commentType) {
      throw new NotFoundException(`No type found for type<${type}>`)
    }

    return ResultWrapper.ok(commentType)
  }

  @LogAndHandle()
  @Transactional()
  async getComment(
    caseId: string,
    commentId: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper<GetCaseCommentResponse>> {
    const relations = getCaseCommentsRelations()

    const comment = await this.caseCommentsModel.findOne({
      where: { caseId: caseId, commentId: commentId },
      include: relations,
      transaction,
    })

    if (!comment) {
      throw new NotFoundException(
        `Comment<${commentId}> not found for case<${caseId}>`,
      )
    }

    const migrated = caseCommentMigrate(comment.caseComment)

    return ResultWrapper.ok({
      comment: migrated,
    })
  }

  @LogAndHandle()
  @Transactional()
  async getComments(
    caseId: string,
    params?: GetCaseCommentsQuery,
    transaction?: Transaction,
  ): Promise<ResultWrapper<GetCaseCommentsResponse>> {
    const relations = getCaseCommentsRelations(params?.internal)

    const comments = await this.caseCommentsModel.findAll({
      where: { case_case_id: caseId },
      include: relations,
      transaction,
    })

    const migrated = comments.map((comment) =>
      caseCommentMigrate(comment.caseComment),
    )

    return ResultWrapper.ok({
      comments: migrated,
    })
  }

  @LogAndHandle()
  @Transactional()
  async createComment(
    caseId: string,
    body: PostCaseCommentBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    const activeCase = (
      await this.utilityService.caseLookup(caseId, transaction)
    ).unwrap()

    const mappedTitle = mapCommentTypeToTitle(body.type)

    this.logger.debug(`Mapped title for type<${body.type}>: ${mappedTitle}`)

    const title = (
      await this.caseCommentTitleLookup(mappedTitle, transaction)
    ).unwrap()

    const newCommentTypeRef = (
      await this.caseCommentTypeLookup(body.type, transaction)
    ).unwrap()

    const newCommentTask = await this.caseCommentTaskModel.create(
      {
        comment: body.comment,
        fromId: body.initiator,
        toId: body.receiver,
        titleId: title.id,
      },
      {
        transaction: transaction,
      },
    )

    let state: string | null = null

    if (body.storeState) {
      try {
        const applicationRes = (
          await this.applicationService.getApplication(activeCase.applicationId)
        ).unwrap()

        const { application } = applicationRes

        state = JSON.stringify(application)
      } catch (e) {
        this.logger.warn(
          `Failed to store state for case<${caseId}> with application<${activeCase.applicationId}>`,
        )
      }
    }

    const newComment = await this.caseCommentModel.create(
      {
        createdAt: new Date().toISOString(),
        internal: body.internal,
        typeId: newCommentTypeRef.id,
        statusId: activeCase.statusId,
        taskId: newCommentTask.id,
        state: state,
      },
      {
        returning: true,
        transaction: transaction,
      },
    )

    // adding row to relation table
    await this.caseCommentsModel.create(
      {
        caseId: caseId,
        commentId: newComment.id,
      },
      {
        transaction: transaction,
      },
    )

    const withRelations = await this.caseCommentModel.findByPk(newComment.id, {
      nest: true,
      include: [
        CaseCommentTypeModel,
        CaseStatusModel,
        { model: CaseCommentTaskModel, include: [CaseCommentTitleModel] },
      ],
      transaction: transaction,
    })

    if (!withRelations) {
      throw new NotFoundException(`Comment<${newComment.id}> not found`)
    }

    return ResultWrapper.ok()
  }

  @LogAndHandle()
  @Transactional()
  async deleteComment(
    caseId: string,
    commentId: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    // check if case and comment exists
    const exists = await this.caseCommentsModel.findOne({
      where: {
        caseId,
        commentId,
      },
      include: [CaseCommentModel],
      transaction,
    })

    if (!exists) {
      throw new NotFoundException(`Comment<${commentId}> not found`)
    }

    // delete from relation table
    await this.caseCommentsModel.destroy({
      where: {
        caseId,
        commentId,
      },
    })

    // delete from comment table
    await this.caseCommentModel.destroy({
      where: {
        id: commentId,
      },
    })

    await this.caseCommentTaskModel.destroy({
      where: {
        id: exists.caseComment.taskId,
      },
    })

    return ResultWrapper.ok()
  }
}
