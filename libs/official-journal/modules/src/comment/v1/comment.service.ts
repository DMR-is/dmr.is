import { Transaction } from 'sequelize'
import { Sequelize } from 'sequelize-typescript'

import {
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { LogAndHandle, Transactional } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import {
  CaseCommentSourceEnum,
  GetCaseCommentResponse,
  GetCaseCommentsResponse,
  PostCaseCommentBody,
} from '@dmr.is/shared-dto'
import { ResultWrapper } from '@dmr.is/types'

import { IApplicationService } from '../../application/application.service.interface'
import { IUtilityService } from '../../utility/utility.module'
import { caseCommentMigrate } from './migrations/case-comment.migrate'
import { CaseCommentModel } from './models/case-comment.model'
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

    @InjectModel(CaseCommentTypeModel)
    private caseCommentTypeModel: typeof CaseCommentTypeModel,

    private readonly sequelize: Sequelize,
  ) {
    this.logger.info('Using CaseCommentSerivce')
  }

  @LogAndHandle()
  @Transactional()
  async getComment(
    caseId: string,
    commentId: string,
    forSource: CaseCommentSourceEnum,
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

    const migrated = caseCommentMigrate(comment.caseComment, forSource)

    return ResultWrapper.ok({
      comment: migrated,
    })
  }

  @LogAndHandle()
  @Transactional()
  async getComments(
    caseId: string,
    internal: boolean,
    forSource: CaseCommentSourceEnum,
    transaction?: Transaction,
  ): Promise<ResultWrapper<GetCaseCommentsResponse>> {
    const relations = getCaseCommentsRelations(internal)

    const comments = await this.caseCommentsModel.findAll({
      where: { case_case_id: caseId },
      include: relations,
      transaction,
    })

    const migrated = comments.map((comment) =>
      caseCommentMigrate(comment.caseComment, forSource),
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
    const caseLookup = (
      await this.utilityService.caseLookup(caseId, transaction)
    ).unwrap()

    const type = await this.caseCommentTypeModel.findOne({
      where: {
        title: body.type,
      },
      transaction,
    })

    if (!type) {
      throw new NotFoundException(`Type<${body.type}> not found`)
    }

    const shouldStoreState = body.storeState === true
    let applicationState: string | null = null

    if (shouldStoreState && caseLookup.applicationId) {
      const { application } = (
        await this.applicationService.getApplication(caseLookup.applicationId)
      ).unwrap()

      applicationState = JSON.stringify(application)
    }

    const newComment = await this.caseCommentModel.create(
      {
        caseId: caseId,
        typeId: type.id,
        caseStatusId: caseLookup.statusId,
        created: new Date().toISOString(),
        source: body.source,
        internal: body.internal,
        creator: body.creator,
        receiver: body.receiver,
        comment: body.comment,
        applicationState: applicationState,
      },
      {
        returning: ['id'],
        transaction: transaction,
      },
    )

    await this.caseCommentsModel.create(
      {
        caseId: caseId,
        commentId: newComment.id,
      },
      {
        transaction: transaction,
      },
    )

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

    return ResultWrapper.ok()
  }
}
