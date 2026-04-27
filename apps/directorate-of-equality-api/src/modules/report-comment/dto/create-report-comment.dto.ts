import { IsEnum, IsNotEmpty, IsString } from 'class-validator'

import { ApiEnum, ApiString } from '@dmr.is/decorators'

import { CommentVisibilityEnum } from '../models/report-comment.model'

export class CreateReportCommentDto {
  @ApiEnum(CommentVisibilityEnum, { enumName: 'CommentVisibilityEnum' })
  @IsEnum(CommentVisibilityEnum)
  visibility!: CommentVisibilityEnum

  @ApiString()
  @IsString()
  @IsNotEmpty()
  body!: string
}
