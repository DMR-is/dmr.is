import { ApiProperty } from '@nestjs/swagger'

import { StatusDto } from '../../status/dto/status.dto'
import { CommentTypeEnum } from '../comment.model'

export class CommentDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ enum: CommentTypeEnum, enumName: 'CommentTypeEnum' })
  type!: string

  @ApiProperty({ type: StatusDto })
  status!: StatusDto

  @ApiProperty({ type: String })
  advertId!: string

  @ApiProperty({ type: String })
  actor!: string

  @ApiProperty({ type: String, required: false })
  receiver?: string

  @ApiProperty({ type: String, required: false })
  comment?: string

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string
}

export class GetCommentsDto {
  @ApiProperty({ type: [CommentDto] })
  comments!: CommentDto[]
}

class CreateCommentBaseDto {
  @ApiProperty({ type: String })
  advertId!: string

  @ApiProperty({ type: String })
  statusId!: string

  @ApiProperty({ type: String })
  actorId!: string
}

export class CreateSubmitCommentDto extends CreateCommentBaseDto {
  @ApiProperty({ enum: CommentTypeEnum, enumName: 'CommentTypeEnum' })
  type!: CommentTypeEnum.SUBMIT
}

export class CreateAssignCommentDto extends CreateCommentBaseDto {
  @ApiProperty({ enum: CommentTypeEnum, enumName: 'CommentTypeEnum' })
  type!: CommentTypeEnum.ASSIGN

  @ApiProperty({ type: String })
  receiverId!: string
}

export class CreateStatusUpdateCommentDto extends CreateCommentBaseDto {
  @ApiProperty({ enum: CommentTypeEnum, enumName: 'CommentTypeEnum' })
  type!: CommentTypeEnum.STATUS_UPDATE

  @ApiProperty({ type: String })
  receiverId!: string
}

export class CreateTextCommentDto extends CreateCommentBaseDto {
  @ApiProperty({ enum: CommentTypeEnum, enumName: 'CommentTypeEnum' })
  type!: CommentTypeEnum.COMMENT

  @ApiProperty({ type: String })
  comment!: string
}
