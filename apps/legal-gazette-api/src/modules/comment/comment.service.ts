import { isUUID } from 'class-validator'

import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { type Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { SYSTEM_ACTOR } from '../../core/constants'
import { AdvertModel } from '../../models/advert.model'
import {
  CommentDto,
  CommentModel,
  CommentTypeEnum,
  CreateAssignCommentDto,
  CreatePublishCommentDto,
  CreateStatusUpdateCommentDto,
  CreateSubmitCommentDto,
  CreateTextCommentDto,
  GetCommentsDto,
} from '../../models/comment.model'
import { StatusIdEnum, StatusModel } from '../../models/status.model'
import { UserModel } from '../../models/users.model'
import { ILGNationalRegistryService } from '../national-registry/national-registry.service.interface'
import { ICommentService } from './comment.service.interface'

const LOGGING_CONTEXT = 'CommentService'

@Injectable()
export class CommentService implements ICommentService {
  constructor(
    @Inject(ILGNationalRegistryService)
    private readonly nationalRegistryService: ILGNationalRegistryService,
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @InjectModel(CommentModel) private commentModel: typeof CommentModel,
    @InjectModel(UserModel) private userModel: typeof UserModel,
    @InjectModel(StatusModel) private statusModel: typeof StatusModel,
    @InjectModel(AdvertModel) private advertModel: typeof AdvertModel,
  ) {}
  async createPublishComment(
    advertId: string,
    body: CreatePublishCommentDto,
  ): Promise<void> {
    const advert = await this.advertModel.findByPkOrThrow(advertId, {
      attributes: ['id', 'statusId'],
    })

    let actor = null

    try {
      if (body.actorId) {
        actor = await this.findActor(body.actorId)
      }
    } catch (e) {
      this.logger.warn(
        'Actor not found for publish comment, marking as system',
        {
          advertId,
          context: LOGGING_CONTEXT,
        },
      )
    }

    if (!actor) {
      actor = {
        id: 'system',
        name: 'Sjálfvirk útgáfa',
      }
    }

    await this.commentModel.create({
      type: CommentTypeEnum.PUBLISH,
      advertId: advert.id,
      statusId: advert.statusId,
      actorId: actor.id,
      actor: actor.name,
    })

    this.logger.info('Publish comment created successfully', {
      advertId,
      context: LOGGING_CONTEXT,
    })
  }

  async createSubmitCommentForExternalSystem(
    advertId: string,
    actorId: string,
    actorName: string,
  ): Promise<void> {
    await this.commentModel.create({
      type: CommentTypeEnum.SUBMIT,
      advertId: advertId,
      statusId: StatusIdEnum.SUBMITTED,
      actorId: actorId,
      actor: actorName,
    })
  }

  private async getAdvertStatusId(advertId: string): Promise<string> {
    const advert = await this.advertModel.findByPkOrThrow(advertId, {
      attributes: ['id', 'statusId'],
    })

    return advert.statusId
  }

  async getCommentsByAdvertId(advertId: string): Promise<GetCommentsDto> {
    const comments = await this.commentModel.findAll({ where: { advertId } })

    return { comments: comments.map((comment) => comment.fromModel()) }
  }

  async deleteComment(commentId: string): Promise<void> {
    this.logger.info(`Deleting comment with id: ${commentId}`, {
      commentId,
      context: LOGGING_CONTEXT,
    })
    await this.commentModel.destroy({ where: { id: commentId } })
  }

  async createSubmitComment(
    advertId: string,
    body: CreateSubmitCommentDto,
  ): Promise<void> {
    const [actor, statusId] = await Promise.all([
      this.findActor(body.actorId),
      this.getAdvertStatusId(advertId),
    ])

    await this.commentModel.create({
      type: CommentTypeEnum.SUBMIT,
      advertId: advertId,
      statusId: statusId,
      actorId: actor.id,
      actor: actor.name,
    })

    this.logger.info('Submit comment created successfully', {
      advertId,
      context: LOGGING_CONTEXT,
    })
  }

  async createAssignComment(
    advertId: string,
    body: CreateAssignCommentDto,
  ): Promise<CommentDto> {
    const [actor, receiver, statusId] = await Promise.all([
      this.findActor(body.actorId),
      this.findActor(body.receiverId),
      this.getAdvertStatusId(advertId),
    ])

    const newComment = await this.commentModel.create({
      type: CommentTypeEnum.ASSIGN,
      advertId: advertId,
      statusId: statusId,
      actorId: actor.id,
      actor: actor.name,
      receiverId: receiver.id,
      receiver: receiver.name,
    })

    await newComment.reload()

    const mapped = newComment.fromModel()

    this.logger.info('Assign comment created successfully', {
      advertId,
      context: LOGGING_CONTEXT,
      commentId: mapped.id,
    })

    return mapped
  }

  async createStatusUpdateComment(
    advertId: string,
    body: CreateStatusUpdateCommentDto,
  ): Promise<CommentDto> {
    const [actor, statusId] = await Promise.all([
      this.findActor(body.actorId),
      this.getAdvertStatusId(advertId),
    ])

    const receiver = await this.statusModel.findByPkOrThrow(body.receiverId)

    const newComment = await this.commentModel.create({
      type: CommentTypeEnum.STATUS_UPDATE,
      advertId: advertId,
      statusId: statusId,
      actorId: actor.id,
      actor: actor.name,
      receiverId: receiver.id,
      receiver: receiver.title,
    })

    await newComment.reload()
    const mapped = newComment.fromModel()

    this.logger.info('Status update comment created successfully', {
      advertId,
      context: LOGGING_CONTEXT,
      commentId: mapped.id,
    })

    return mapped
  }

  async createTextComment(
    advertId: string,
    body: CreateTextCommentDto,
  ): Promise<CommentDto> {
    const [actor, statusId] = await Promise.all([
      this.findActor(body.actorId),
      this.getAdvertStatusId(advertId),
    ])

    const newComment = await this.commentModel.create({
      type: CommentTypeEnum.COMMENT,
      advertId: advertId,
      statusId: statusId,
      actorId: actor.id,
      actor: actor.name,
      comment: body.comment,
    })

    await newComment.reload()
    const mapped = newComment.fromModel()

    this.logger.info('Text comment created successfully', {
      advertId,
      context: LOGGING_CONTEXT,
      commentId: mapped.id,
    })

    return mapped
  }

  private async findActor(actorId: string): Promise<{
    name: string
    id: string
  }> {
    this.logger.debug(`Looking for actor with id: ${actorId}`, {
      context: LOGGING_CONTEXT,
    })

    if (actorId === SYSTEM_ACTOR.id) {
      this.logger.info('Actor is system actor', { context: LOGGING_CONTEXT })
      return SYSTEM_ACTOR
    }

    const isId = isUUID(actorId)

    const where = isId ? { id: actorId } : { nationalId: actorId }

    const existingUser = await this.userModel.findOne({ where })

    if (existingUser) {
      this.logger.debug('Actor found in users table', {
        context: LOGGING_CONTEXT,
      })
      return {
        name: existingUser.fullName,
        id: isId ? existingUser.id : existingUser.nationalId,
      }
    }

    const person =
      await this.nationalRegistryService.getEntityByNationalId(actorId)

    if (person.entity === null) {
      this.logger.warn(
        'Neither user or person in national registry found when looking for actor',
        {
          context: LOGGING_CONTEXT,
        },
      )
      throw new NotFoundException('Actor not found')
    }

    this.logger.debug('Actor found', { context: LOGGING_CONTEXT })

    return {
      name: person.entity.nafn,
      id: person.entity.kennitala,
    }
  }
}
