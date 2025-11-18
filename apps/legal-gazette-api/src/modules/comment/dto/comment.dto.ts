import { IsString } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

import { CommentTypeEnum } from '../../../models/comment.model'
import { StatusDto } from '../../status/dto/status.dto'

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
