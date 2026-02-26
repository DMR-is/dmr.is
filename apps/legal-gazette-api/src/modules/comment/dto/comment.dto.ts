import { ApiProperty } from '@nestjs/swagger'

import { ApiString } from '@dmr.is/decorators'

import { CommentDto } from '../../../models/comment.model'

export class GetCommentsDto {
  @ApiProperty({ type: [CommentDto] })
  comments!: CommentDto[]
}

class CreateCommentBaseDto {
  @ApiProperty({ type: String })
  actorId!: string
}

export class CreateSubmitCommentDto extends CreateCommentBaseDto {}

export class CreatePublishCommentDto {
  @ApiProperty({ type: String, required: false })
  actorId?: string
}

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
  @ApiString()
  comment!: string
}
