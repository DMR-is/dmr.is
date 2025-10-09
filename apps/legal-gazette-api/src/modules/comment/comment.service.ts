import { Op } from 'sequelize'

import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { StatusModel } from '../status/status.model'
import { UserModel } from '../users/users.model'
import {
  CommentDto,
  CreateAssignCommentDto,
  CreateStatusUpdateCommentDto,
  CreateSubmitCommentDto,
  CreateTextCommentDto,
  GetCommentsDto,
} from './dto/comment.dto'
import { CommentModel, CommentTypeEnum } from './comment.model'
import { ICommentService } from './comment.service.interface'

@Injectable()
export class CommentService implements ICommentService {
  constructor(
    @InjectModel(CommentModel) private commentModel: typeof CommentModel,
    @InjectModel(UserModel) private userModel: typeof UserModel,
    @InjectModel(StatusModel) private statusModel: typeof StatusModel,
  ) {}

  async getCommentsByAdvertId(advertId: string): Promise<GetCommentsDto> {
    const comments = await this.commentModel.findAll({ where: { advertId } })

    return { comments: comments.map((comment) => comment.fromModel()) }
  }

  async deleteComment(commentId: string): Promise<void> {
    await this.commentModel.destroy({ where: { id: commentId } })
  }

  async createSubmitComment(body: CreateSubmitCommentDto): Promise<CommentDto> {
    const actor = await this.userModel.findOneOrThrow({
      where: {
        [Op.or]: {
          id: body.actorId,
          nationalId: body.actorId,
        },
      },
    })

    const newComment = await this.commentModel.create(
      {
        type: CommentTypeEnum.SUBMIT,
        advertId: body.advertId,
        statusId: body.statusId,
        actorId: actor.id,
        actor: actor.fullName,
      },
      {
        returning: true,
        include: [StatusModel],
      },
    )

    return newComment.fromModel()
  }

  async createAssignComment(body: CreateAssignCommentDto): Promise<CommentDto> {
    const actor = await this.userModel.findOneOrThrow({
      where: {
        [Op.or]: {
          id: body.actorId,
          nationalId: body.actorId,
        },
      },
    })

    const receiver = await this.userModel.findOneOrThrow({
      where: {
        [Op.or]: {
          id: body.receiverId,
          nationalId: body.receiverId,
        },
      },
    })

    const newComment = await this.commentModel.create(
      {
        type: CommentTypeEnum.ASSIGN,
        advertId: body.advertId,
        statusId: body.statusId,
        actorId: actor.id,
        actor: actor.fullName,
        receiverId: receiver.id,
        receiver: receiver.fullName,
      },
      {
        returning: true,
        include: [StatusModel],
      },
    )

    return newComment.fromModel()
  }

  async createStatusUpdateComment(
    body: CreateStatusUpdateCommentDto,
  ): Promise<CommentDto> {
    const actor = await this.userModel.findOneOrThrow({
      where: {
        [Op.or]: {
          id: body.actorId,
          nationalId: body.actorId,
        },
      },
    })

    const receiver = await this.statusModel.findByPkOrThrow(body.receiverId)

    const newComment = await this.commentModel.create(
      {
        type: CommentTypeEnum.STATUS_UPDATE,
        advertId: body.advertId,
        statusId: body.statusId,
        actorId: actor.id,
        actor: actor.fullName,
        receiverId: receiver.id,
        receiver: receiver.title,
      },
      {
        returning: true,
        include: [StatusModel],
      },
    )

    return newComment.fromModel()
  }

  async createTextComment(body: CreateTextCommentDto): Promise<CommentDto> {
    const actor = await this.userModel.findOneOrThrow({
      where: {
        [Op.or]: {
          id: body.actorId,
          nationalId: body.actorId,
        },
      },
    })

    const newComment = await this.commentModel.create(
      {
        type: CommentTypeEnum.COMMENT,
        advertId: body.advertId,
        statusId: body.statusId,
        actorId: actor.id,
        actor: actor.fullName,
        comment: body.comment,
      },
      {
        returning: true,
        include: [StatusModel],
      },
    )

    return newComment.fromModel()
  }
}
