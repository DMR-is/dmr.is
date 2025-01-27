import { Op, Transaction } from 'sequelize'
import { Sequelize } from 'sequelize-typescript'
import { v4 as uuid } from 'uuid'
import { LogAndHandle, Transactional } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { CaseActionEnum } from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'

import {
  Inject,
  InternalServerErrorException,
  NotFoundException,
  NotImplementedException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { AdminUserModel } from '../../admin-user/models/admin-user.model'
import { ApplicationUserModel } from '../../application-user/models'
import { CaseModel, CaseStatusModel } from '../../case/models'
import { AdvertInvolvedPartyModel } from '../../journal/models'
import {
  ApplicationCommentBody,
  AssignSelfCommentBody,
  AssignUserCommentBody,
  ExternalCommentBody,
  GetComment,
  InternalCommentBody,
  SubmitCommentBody,
  UpdateStatusCommentBody,
} from './dto/comment.dto'
import { CaseActionModel } from './models/case-action.model'
import { CommentModel } from './models/comment.model'
import { ICommentServiceV2 } from './comment.service.interface'
import { commentMigrate } from './migrations'

const LOGGING_CONTEXT = 'CommentServiceV2'
const LOGGING_CATEGORY = 'comment-service-v2'

export class CommentServiceV2 implements ICommentServiceV2 {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @InjectModel(CommentModel)
    private readonly commentModel: typeof CommentModel,

    @InjectModel(CaseActionModel)
    private readonly caseActionModel: typeof CaseActionModel,
    @InjectModel(CaseModel) private readonly caseModel: typeof CaseModel,
    private sequelize: Sequelize,
  ) {}

  @Transactional()
  private async getCreateValues(
    caseId: string,
    action: CaseActionEnum,
    transaction?: Transaction,
  ) {
    const now = new Date()
    const newCommentId = uuid()
    const caseLookupPromise = this.caseModel.findByPk(caseId, {
      attributes: ['id'],
      include: [
        {
          model: CaseStatusModel,
          attributes: ['id', 'title', 'slug'],
        },
        {
          model: AdvertInvolvedPartyModel,
          attributes: ['id', 'title', 'slug'],
        },
      ],
      transaction,
    })

    const caseActionPromise = this.caseActionModel.findOne({
      where: {
        title: {
          [Op.eq]: action,
        },
      },
    })

    const [caseLookup, caseAction] = await Promise.all([
      caseLookupPromise,
      caseActionPromise,
    ])

    if (!caseLookup) {
      this.logger.warn(`Case with id ${caseId} not found`, {
        caseId: caseId,
        context: LOGGING_CONTEXT,
        category: LOGGING_CATEGORY,
      })
      throw new NotFoundException(`Case with id ${caseId} not found`)
    }

    if (!caseAction) {
      this.logger.warn(`Case action with title ${action} not found`, {
        action: action,
        context: LOGGING_CONTEXT,
        category: LOGGING_CATEGORY,
      })
      throw new NotFoundException(`Case action with title ${action} not found`)
    }

    return {
      now: now.toISOString(),
      commentId: newCommentId,
      statusId: caseLookup.status.id,
      actionId: caseAction.id,
      involvedPartyId: caseLookup.involvedParty.id,
    }
  }

  @LogAndHandle()
  @Transactional()
  async createSubmitComment(
    caseId: string,
    body: SubmitCommentBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper<GetComment>> {
    const { now, commentId, statusId, actionId } = await this.getCreateValues(
      caseId,
      CaseActionEnum.SUBMIT,
      transaction,
    )

    await this.commentModel.create(
      {
        id: commentId,
        caseId: caseId,
        createdStatusId: statusId,
        caseActionId: actionId,
        institutionCreatorId: body.institutionCreatorId,
        created: now,
      },
      {
        transaction,
      },
    )

    const newComment = await this.commentModel.findByPk(commentId, {
      include: [
        {
          model: CaseStatusModel,
          attributes: ['id', 'title', 'slug'],
          as: 'createdCaseStatus',
        },
        { model: CaseActionModel, attributes: ['id', 'title', 'slug'] },
        {
          model: AdvertInvolvedPartyModel,
          attributes: ['id', 'title', 'slug'],
        },
      ],
      transaction,
    })

    if (!newComment) {
      this.logger.warn(`Comment was not found after creation`, {
        caseId,
        commentId,
        context: LOGGING_CONTEXT,
        category: LOGGING_CATEGORY,
      })
      throw new InternalServerErrorException('Could not create comment')
    }

    const migrated = commentMigrate(newComment)

    return ResultWrapper.ok({ comment: migrated })
  }

  @LogAndHandle()
  @Transactional()
  async createAssignUserComment(
    caseId: string,
    body: AssignUserCommentBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper<GetComment>> {
    const { now, commentId, statusId, actionId } = await this.getCreateValues(
      caseId,
      CaseActionEnum.ASSIGN_USER,
      transaction,
    )

    await this.commentModel.create(
      {
        id: commentId,
        caseId: caseId,
        createdStatusId: statusId,
        caseActionId: actionId,
        adminUserCreatorId: body.adminUserCreatorId,
        adminUserReceiverId: body.adminUserReceiverId,
        created: now,
      },
      {
        transaction,
      },
    )

    const newComment = await this.commentModel.findByPk(commentId, {
      include: [
        {
          model: CaseStatusModel,
          attributes: ['id', 'title', 'slug'],
          as: 'createdCaseStatus',
        },
        { model: CaseActionModel, attributes: ['id', 'title', 'slug'] },
        {
          model: AdminUserModel,
          as: 'adminUserCreator',
        },
        {
          model: AdminUserModel,
          as: 'adminUserReceiver',
        },
      ],
      transaction,
    })

    if (!newComment) {
      this.logger.warn(`Comment was not found after creation`, {
        caseId,
        commentId,
        context: LOGGING_CONTEXT,
        category: LOGGING_CATEGORY,
      })
      throw new InternalServerErrorException('Could not create comment')
    }

    const migrated = commentMigrate(newComment)
    return ResultWrapper.ok({ comment: migrated })
  }

  @LogAndHandle()
  @Transactional()
  async createAssignSelfComment(
    caseId: string,
    body: AssignSelfCommentBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper<GetComment>> {
    const { now, commentId, statusId, actionId } = await this.getCreateValues(
      caseId,
      CaseActionEnum.ASSIGN_SELF,
      transaction,
    )

    await this.commentModel.create(
      {
        id: commentId,
        caseId: caseId,
        createdStatusId: statusId,
        caseActionId: actionId,
        adminUserCreatorId: body.adminUserCreatorId,
        created: now,
      },
      {
        transaction,
      },
    )

    const newComment = await this.commentModel.findByPk(commentId, {
      include: [
        {
          model: CaseStatusModel,
          attributes: ['id', 'title', 'slug'],
          as: 'createdCaseStatus',
        },
        { model: CaseActionModel, attributes: ['id', 'title', 'slug'] },
        {
          model: AdminUserModel,
          as: 'adminUserCreator',
        },
      ],
      transaction,
    })

    if (!newComment) {
      this.logger.warn(`Comment was not found after creation`, {
        caseId,
        commentId,
        context: LOGGING_CONTEXT,
        category: LOGGING_CATEGORY,
      })
      throw new InternalServerErrorException('Could not create comment')
    }

    const migrated = commentMigrate(newComment)

    return ResultWrapper.ok({ comment: migrated })
  }

  @LogAndHandle()
  @Transactional()
  async createUpdateStatusComment(
    caseId: string,
    body: UpdateStatusCommentBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper<GetComment>> {
    const { now, commentId, statusId, actionId } = await this.getCreateValues(
      caseId,
      CaseActionEnum.UPDATE_STATUS,
      transaction,
    )

    await this.commentModel.create(
      {
        id: commentId,
        caseId: caseId,
        createdStatusId: statusId,
        caseActionId: actionId,
        adminUserCreatorId: body.adminUserCreatorId,
        caseStatusReceiverId: body.caseStatusReceiverId,
        created: now,
      },
      {
        transaction,
      },
    )

    const newComment = await this.commentModel.findByPk(commentId, {
      include: [
        {
          model: CaseStatusModel,
          attributes: ['id', 'title', 'slug'],
          as: 'createdCaseStatus',
        },
        { model: CaseActionModel, attributes: ['id', 'title', 'slug'] },
        { model: AdminUserModel, as: 'adminUserCreator' },
        {
          model: CaseStatusModel,
          attributes: ['id', 'title', 'slug'],
          as: 'caseStatusReceiver',
        },
      ],
      transaction,
    })

    if (!newComment) {
      this.logger.warn(`Comment was not found after creation`, {
        caseId,
        commentId,
        context: LOGGING_CONTEXT,
        category: LOGGING_CATEGORY,
      })
      throw new InternalServerErrorException('Could not create comment')
    }

    const migrated = commentMigrate(newComment)

    return ResultWrapper.ok({ comment: migrated })
  }

  @LogAndHandle()
  @Transactional()
  async createInternalComment(
    caseId: string,
    body: InternalCommentBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper<GetComment>> {
    const { now, commentId, statusId, actionId } = await this.getCreateValues(
      caseId,
      CaseActionEnum.COMMENT_INTERNAL,
      transaction,
    )

    await this.commentModel.create(
      {
        id: commentId,
        caseId: caseId,
        createdStatusId: statusId,
        caseActionId: actionId,
        adminUserCreatorId: body.adminUserCreatorId,
        comment: body.comment,
        created: now,
      },
      {
        transaction,
      },
    )

    const newComment = await this.commentModel.findByPk(commentId, {
      include: [
        {
          model: CaseStatusModel,
          attributes: ['id', 'title', 'slug'],
          as: 'createdCaseStatus',
        },
        { model: CaseActionModel, attributes: ['id', 'title', 'slug'] },
        { model: AdminUserModel, as: 'adminUserCreator' },
      ],
      transaction,
    })

    if (!newComment) {
      this.logger.warn(`Comment was not found after creation`, {
        caseId,
        commentId,
        context: LOGGING_CONTEXT,
        category: LOGGING_CATEGORY,
      })
      throw new InternalServerErrorException('Could not create comment')
    }

    const migrated = commentMigrate(newComment)

    return ResultWrapper.ok({ comment: migrated })
  }

  @LogAndHandle()
  @Transactional()
  async createExternalComment(
    caseId: string,
    body: ExternalCommentBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper<GetComment>> {
    const { now, commentId, statusId, actionId } = await this.getCreateValues(
      caseId,
      CaseActionEnum.COMMENT_EXTERNAL,
      transaction,
    )

    await this.commentModel.create(
      {
        id: commentId,
        caseId: caseId,
        createdStatusId: statusId,
        caseActionId: actionId,
        adminUserCreatorId: body.adminUserCreatorId,
        comment: body.comment,
        created: now,
      },
      {
        transaction,
      },
    )

    const newComment = await this.commentModel.findByPk(commentId, {
      include: [
        {
          model: CaseStatusModel,
          attributes: ['id', 'title', 'slug'],
          as: 'createdCaseStatus',
        },
        { model: CaseActionModel, attributes: ['id', 'title', 'slug'] },
        {
          model: AdvertInvolvedPartyModel,
          attributes: ['id', 'title', 'slug'],
        },
      ],
      transaction,
    })

    if (!newComment) {
      this.logger.warn(`Comment was not found after creation`, {
        caseId,
        commentId,
        context: LOGGING_CONTEXT,
        category: LOGGING_CATEGORY,
      })
      throw new InternalServerErrorException('Could not create comment')
    }

    const migrated = commentMigrate(newComment)

    return ResultWrapper.ok({ comment: migrated })
  }

  @LogAndHandle()
  @Transactional()
  async createApplicationComment(
    caseId: string,
    body: ApplicationCommentBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper<GetComment>> {
    const { now, commentId, statusId, actionId, involvedPartyId } =
      await this.getCreateValues(
        caseId,
        CaseActionEnum.COMMENT_APPLICATION,
        transaction,
      )

    await this.commentModel.create(
      {
        id: commentId,
        caseId: caseId,
        createdStatusId: statusId,
        caseActionId: actionId,
        applicationUserCreatorId: body.applicationUserCreatorId,
        comment: body.comment,
        created: now,
      },
      {
        transaction,
      },
    )

    const newComment = await this.commentModel.findByPk(commentId, {
      include: [
        {
          model: CaseStatusModel,
          attributes: ['id', 'title', 'slug'],
          as: 'createdCaseStatus',
        },
        { model: CaseActionModel, attributes: ['id', 'title', 'slug'] },
        {
          model: ApplicationUserModel,
          include: [
            {
              model: AdvertInvolvedPartyModel,
            },
          ],
        },
      ],
      transaction,
    })

    if (!newComment) {
      this.logger.warn(`Comment was not found after creation`, {
        caseId,
        commentId,
        context: LOGGING_CONTEXT,
        category: LOGGING_CATEGORY,
      })
      throw new InternalServerErrorException('Could not create comment')
    }

    const migrated = commentMigrate(newComment, involvedPartyId)

    return ResultWrapper.ok({ comment: migrated })
  }
}
