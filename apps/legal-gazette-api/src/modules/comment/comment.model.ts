import {
  BelongsTo,
  Column,
  DataType,
  DefaultScope,
  ForeignKey,
} from 'sequelize-typescript'

import { BaseModel } from '@dmr.is/shared/models/base'

import { AdvertModel } from '../advert/advert.model'
import { StatusModel } from '../status/status.model'
import { CommentDto } from './dto/comment.dto'

export enum CommentTypeEnum {
  SUBMIT = 'SUBMIT',
  ASSIGN = 'ASSIGN',
  STATUS_UPDATE = 'STATUS_UPDATE',
  COMMENT = 'COMMENT',
}

type CommentAttributes = {
  type: CommentTypeEnum
  statusId: string
  advertId: string
  actorId: string
  actor: string
  receiverId?: string
  receiver?: string
  comment?: string
}

type CreateCommentBaseAttributes = {
  advertId: string
  statusId: string
  actorId: string
}

type CreateSubmitComment = CreateCommentBaseAttributes & {
  type: CommentTypeEnum.SUBMIT
}

type CreateAssignComment = CreateCommentBaseAttributes & {
  type: CommentTypeEnum.ASSIGN
  receiverId: string
}

type CreateStatusUpdateComment = CreateCommentBaseAttributes & {
  type: CommentTypeEnum.STATUS_UPDATE
  receiverId: string
}

type CreateTextComment = CreateCommentBaseAttributes & {
  type: CommentTypeEnum.COMMENT
  comment: string
}

type CreateCommentAttributes =
  | CreateSubmitComment
  | CreateAssignComment
  | CreateStatusUpdateComment
  | CreateTextComment

@DefaultScope(() => ({
  include: [{ model: StatusModel }],
  order: [['createdAt', 'DESC']],
}))
export class CommentModel extends BaseModel<
  CommentAttributes,
  CreateCommentAttributes
> {
  @Column({
    type: DataType.ENUM(...Object.values(CommentTypeEnum)),
    allowNull: false,
  })
  type!: CommentTypeEnum

  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  @ForeignKey(() => StatusModel)
  statusId!: string

  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  @ForeignKey(() => AdvertModel)
  advertId!: string

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  actorId!: string

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  actor!: string

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  receiverId?: string

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  receiver?: string

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  comment?: string

  @BelongsTo(() => AdvertModel)
  advert!: AdvertModel

  @BelongsTo(() => StatusModel)
  status!: StatusModel

  static fromModel(model: CommentModel): CommentDto {
    return {
      id: model.id,
      createdAt: model.createdAt.toISOString(),
      type: model.type,
      status: model.status.fromModel(),
      advertId: model.advertId,
      actor: model.actor,
      receiver: model.receiver,
      comment: model.comment,
    }
  }
}
