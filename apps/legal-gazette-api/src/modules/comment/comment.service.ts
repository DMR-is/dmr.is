import { isUUID } from 'class-validator'

import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { AdvertModel } from '../../models/advert.model'
import { StatusModel } from '../../models/status.model'
import { UserModel } from '../../models/users.model'
import {
  CommentDto,
  CreateAssignCommentDto,
  CreateStatusUpdateCommentDto,
  CreateSubmitCommentDto,
  CreateTextCommentDto,
  GetCommentsDto,
} from './dto/comment.dto'
import { CommentModel, CommentTypeEnum } from '../../models/comment.model'
import { ICommentService } from './comment.service.interface'

@Injectable()
export class CommentService implements ICommentService {
  constructor(
    @InjectModel(CommentModel) private commentModel: typeof CommentModel,
    @InjectModel(UserModel) private userModel: typeof UserModel,
    @InjectModel(StatusModel) private statusModel: typeof StatusModel,
    @InjectModel(AdvertModel) private advertModel: typeof AdvertModel,
  ) {}

  private async getAdvertStatusId(advertId: string): Promise<string> {
    const advert = await this.advertModel.unscoped().findByPkOrThrow(advertId, {
      attributes: ['id', 'statusId'],
    })

    return advert.statusId
  }

  private async findActor(actorId: string) {
    const isId = isUUID(actorId)
    if (isId) return await this.userModel.findByPkOrThrow(actorId)

    return await this.userModel.findOneOrThrow({
      where: {
        nationalId: actorId,
      },
    })
  }

  async getCommentsByAdvertId(advertId: string): Promise<GetCommentsDto> {
    const comments = await this.commentModel.findAll({ where: { advertId } })

    return { comments: comments.map((comment) => comment.fromModel()) }
  }

  async deleteComment(commentId: string): Promise<void> {
    await this.commentModel.destroy({ where: { id: commentId } })
  }

  async createSubmitComment(
    advertId: string,
    body: CreateSubmitCommentDto,
  ): Promise<CommentDto> {
    const [actor, statusId] = await Promise.all([
      this.findActor(body.actorId),
      this.getAdvertStatusId(advertId),
    ])

    const newComment = await this.commentModel.create({
      type: CommentTypeEnum.SUBMIT,
      advertId: advertId,
      statusId: statusId,
      actorId: actor.id,
      actor: actor.fullName,
    })

    await newComment.reload()
    return newComment.fromModel()
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
      actor: actor.fullName,
      receiverId: receiver.id,
      receiver: receiver.fullName,
    })

    await newComment.reload()
    return newComment.fromModel()
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
      actor: actor.fullName,
      receiverId: receiver.id,
      receiver: receiver.title,
    })

    await newComment.reload()
    return newComment.fromModel()
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
      actor: actor.fullName,
      comment: body.comment,
    })

    await newComment.reload()
    return newComment.fromModel()
  }
}
