import { IsString } from 'class-validator'
import {
  BelongsTo,
  Column,
  DataType,
  DefaultScope,
  ForeignKey,
} from 'sequelize-typescript'

import { ApiProperty, PickType } from '@nestjs/swagger'

import { BaseModel, BaseTable } from '@dmr.is/shared/models/base'

import { LegalGazetteModels } from '../lib/constants'
import { AdvertModel } from './advert.model'
import { StatusDto, StatusModel } from './status.model'

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
  actor: string
}

type CreateSubmitComment = CreateCommentBaseAttributes & {
  type: CommentTypeEnum.SUBMIT
}

type CreateAssignComment = CreateCommentBaseAttributes & {
  type: CommentTypeEnum.ASSIGN
  receiverId: string
  receiver: string
}

type CreateStatusUpdateComment = CreateCommentBaseAttributes & {
  type: CommentTypeEnum.STATUS_UPDATE
  receiverId: string
  receiver: string
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
@BaseTable({ tableName: LegalGazetteModels.COMMENT })
export class CommentModel extends BaseModel<
  CommentAttributes,
  CreateCommentAttributes
> {
  @Column({
    type: DataType.ENUM(...Object.values(CommentTypeEnum)),
    allowNull: false,
  })
  @ApiProperty({ enum: CommentTypeEnum, enumName: 'CommentTypeEnum' })
  type!: CommentTypeEnum

  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  @ForeignKey(() => StatusModel)
  @ApiProperty({ type: String })
  statusId!: string

  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  @ForeignKey(() => AdvertModel)
  @ApiProperty({ type: String })
  advertId!: string

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  @ApiProperty({ type: String })
  actorId!: string

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  @ApiProperty({ type: String })
  actor!: string

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  @ApiProperty({ type: String, required: false })
  receiverId?: string

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  @ApiProperty({ type: String, required: false })
  receiver?: string

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  @ApiProperty({ type: String, required: false })
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

  fromModel(): CommentDto {
    return CommentModel.fromModel(this)
  }
}

export class CommentDto extends PickType(CommentModel, [
  'id',
  'type',
  'advertId',
  'actor',
  'receiver',
  'comment',
] as const) {
  @ApiProperty({ type: StatusDto })
  status!: StatusDto

  @ApiProperty({ type: String })
  createdAt!: string
}

export class GetCommentsDto {
  @ApiProperty({ type: [CommentDto] })
  comments!: CommentDto[]
}

class CreateCommentBaseDto {
  @ApiProperty({ type: String })
  actorId!: string
}

export class CreateSubmitCommentDto extends CreateCommentBaseDto {}

export class CreateAssignCommentDto extends CreateCommentBaseDto {
  @ApiProperty({ type: String })
  receiverId!: string
}

export class CreateStatusUpdateCommentDto extends CreateCommentBaseDto {
  @ApiProperty({ type: String })
  receiverId!: string
}

export class CreateTextCommentDto extends CreateCommentBaseDto {
  @ApiProperty({ type: String })
  comment!: string
}

export class CreateTextCommentBodyDto {
  @ApiProperty({ type: String })
  @IsString()
  comment!: string
}
