import Mail from 'nodemailer/lib/mailer'
import { Op, Transaction } from 'sequelize'
import { Sequelize } from 'sequelize-typescript'
import { v4 as uuid } from 'uuid'

import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { LogAndHandle, Transactional } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import {
  ApplicationCommentBody,
  AssignSelfCommentBody,
  AssignUserCommentBody,
  CaseActionEnum,
  ExternalCommentBody,
  GetComment,
  GetComments,
  GetCommentsQuery,
  InternalCommentBody,
  SubmitCommentBody,
  UpdateStatusCommentBody,
} from '@dmr.is/shared-dto'
import { IAWSService } from '@dmr.is/shared-modules'
import { ResultWrapper } from '@dmr.is/types'

import { AdvertTypeModel } from '../../advert-type/models'
import { CaseChannelModel, CaseModel, CaseStatusModel } from '../../case/models'
import { AdvertInvolvedPartyModel } from '../../journal/models'
import { UserModel } from '../../user/models/user.model'
import { commentMigrate } from './migrations/comment.migrate'
import { CaseActionModel } from './models/case-action.model'
import { CommentModel } from './models/comment.model'
import { CommentsModel } from './models/comments.model'
import { ICommentServiceV2 } from './comment.service.interface'
const LOGGING_CONTEXT = 'CommentServiceV2'
const LOGGING_CATEGORY = 'comment-service-v2'

@Injectable()
export class CommentServiceV2 implements ICommentServiceV2 {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @InjectModel(CommentModel)
    private readonly commentModel: typeof CommentModel,

    @InjectModel(CaseActionModel)
    private readonly caseActionModel: typeof CaseActionModel,

    @InjectModel(CommentsModel)
    private readonly commentsModel: typeof CommentsModel,
    @InjectModel(CaseModel) private readonly caseModel: typeof CaseModel,
    private sequelize: Sequelize,
    @Inject(IAWSService)
    private readonly awsService: IAWSService,
  ) {}

  @LogAndHandle()
  @Transactional()
  private async addCommentToCase(
    caseId: string,
    commentId: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    await this.commentsModel.create(
      {
        caseId: caseId,
        commentId: commentId,
      },
      {
        transaction,
      },
    )

    return ResultWrapper.ok()
  }

  @LogAndHandle()
  async deleteComment(
    caseId: string,
    commentId: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    const commentsPromise = this.commentsModel.destroy({
      where: {
        commentId: commentId,
        caseId: caseId,
      },
      transaction,
    })

    const commentPromise = this.commentModel.destroy({
      where: {
        id: commentId,
        caseId: caseId,
      },
      transaction,
    })

    await Promise.all([commentsPromise, commentPromise])

    return ResultWrapper.ok()
  }

  @LogAndHandle()
  async getCommentById(
    caseId: string,
    commentId: string,
  ): Promise<ResultWrapper<GetComment>> {
    const comment = await this.commentModel.findByPk(commentId, {
      include: [
        {
          attributes: ['id'],
          model: CaseModel,
          required: true,
          where: {
            id: caseId,
          },
        },
        {
          model: CaseStatusModel,
          attributes: ['id', 'title', 'slug'],
          as: 'createdCaseStatus',
        },
        { model: CaseActionModel, attributes: ['id', 'title', 'slug'] },
        {
          model: UserModel,
          as: 'userCreator',
        },
        {
          model: UserModel,
          as: 'userReceiver',
        },
        {
          model: AdvertInvolvedPartyModel,
          attributes: ['id', 'title', 'slug'],
        },
        {
          model: CaseStatusModel,
          attributes: ['id', 'title', 'slug'],
          as: 'caseStatusReceiver',
        },
      ],
    })

    if (!comment) {
      this.logger.warn(`Comment with id ${commentId} not found`, {
        commentId,
        context: LOGGING_CONTEXT,
        category: LOGGING_CATEGORY,
      })
      throw new NotFoundException(`Comment with id ${commentId} not found`)
    }

    const migrated = commentMigrate(comment)

    return ResultWrapper.ok({ comment: migrated })
  }

  @LogAndHandle()
  async getComments(
    caseId: string,
    query?: GetCommentsQuery,
    involvedPartyId?: string,
  ): Promise<ResultWrapper<GetComments>> {
    const whereParams = {}

    if (query?.action) {
      Object.assign(whereParams, {
        title: { [Op.in]: query.action },
      })
    }

    const comments = await this.commentModel.findAll({
      where: {
        caseId: caseId,
      },
      include: [
        {
          model: CaseStatusModel,
          attributes: ['id', 'title', 'slug'],
          as: 'createdCaseStatus',
        },
        {
          model: CaseActionModel,
          attributes: ['id', 'title', 'slug'],
          where: whereParams,
        },
        {
          model: UserModel,
          as: 'userCreator',
        },
        {
          model: UserModel,
          as: 'userReceiver',
        },
        {
          model: AdvertInvolvedPartyModel,
          attributes: ['id', 'title', 'slug'],
        },
        {
          model: CaseStatusModel,
          attributes: ['id', 'title', 'slug'],
          as: 'caseStatusReceiver',
        },
      ],
      order: [['created', 'ASC']],
    })

    return ResultWrapper.ok({
      comments: comments.map((comment) =>
        commentMigrate(comment, involvedPartyId),
      ),
    })
  }

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

    ResultWrapper.unwrap(
      await this.addCommentToCase(caseId, commentId, transaction),
    )
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
        userCreatorId: body.adminUserCreatorId,
        userReceiverId: body.adminUserReceiverId,
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
          model: UserModel,
          as: 'userCreator',
        },
        {
          model: UserModel,
          as: 'userReceiver',
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
    ResultWrapper.unwrap(
      await this.addCommentToCase(caseId, commentId, transaction),
    )
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
        userCreatorId: body.adminUserCreatorId,
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
          model: UserModel,
          as: 'userCreator',
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

    ResultWrapper.unwrap(
      await this.addCommentToCase(caseId, commentId, transaction),
    )
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
        userCreatorId: body.adminUserCreatorId,
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
        { model: UserModel, as: 'userCreator' },
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

    ResultWrapper.unwrap(
      await this.addCommentToCase(caseId, commentId, transaction),
    )
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
        userCreatorId: body.adminUserCreatorId,
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
        { model: UserModel, as: 'userCreator' },
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

    ResultWrapper.unwrap(
      await this.addCommentToCase(caseId, commentId, transaction),
    )
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
        userCreatorId: body.adminUserCreatorId,
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
        { model: UserModel, as: 'userCreator' },
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

    ResultWrapper.unwrap(
      await this.addCommentToCase(caseId, commentId, transaction),
    )

    // send email via SES
    const _case = await this.caseModel.findByPk(caseId, {
      attributes: ['caseNumber', 'id', 'advertTitle'],
      include: [
        { model: CaseChannelModel },
        { model: AdvertTypeModel, attributes: ['title'] },
      ],
      transaction,
    })

    const emails = _case?.channels?.flatMap((item) => {
      if (!item.email) {
        return []
      }
      return [item.email]
    })

    if (emails?.length) {
      try {
        const message: Mail.Options = {
          from: `Stjórnartíðindi <noreply@stjornartidindi.is>`,
          to: emails.join(','),
          replyTo: 'noreply@stjornartidindi.is',
          subject: `Ný athugasemd skráð á umsókn ${_case?.caseNumber} - ${_case?.advertType.title} ${_case?.advertTitle}`,
          text: `Ný athugasemd hefur verið skráð á umsókn ${_case?.caseNumber}`,
          html: `<h2>Ný athugasemd hefur verið skráð á umsókn ${_case?.caseNumber} - ${_case?.advertType.title} ${_case?.advertTitle}</h2><p>${migrated.creator.title}: ${migrated.comment}</p><p><a href="https://island.is/umsoknir/stjornartidindi/${_case?.applicationId}" target="_blank">Skoða umsókn</a></p>`,
        }

        await this.awsService.sendMail(message)
      } catch (error) {
        this.logger.warn(`Email not sent`, {
          error,
          caseId,
          commentId,
          context: LOGGING_CONTEXT,
          category: LOGGING_CATEGORY,
        })
      }
    }
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
        userCreatorId: body.applicationUserCreatorId,
        applicationUserName: body.applicationUserName,
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
          model: UserModel,
          as: 'userCreator',
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

    ResultWrapper.unwrap(
      await this.addCommentToCase(caseId, commentId, transaction),
    )
    return ResultWrapper.ok({ comment: migrated })
  }
}
