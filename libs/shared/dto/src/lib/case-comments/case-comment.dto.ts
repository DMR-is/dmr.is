import { IsUUID } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

import { CaseStatusEnum } from '../cases'
import {
  CaseCommentDirectionEnum,
  CaseCommentTypeTitleEnum,
} from './case-comment-constants'

export class CaseComment {
  @ApiProperty({
    type: String,
    example: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
    description: 'Id of the case comment.',
  })
  @IsUUID()
  readonly id!: string

  @ApiProperty({
    type: Boolean,
    description: 'Is the comment internal.',
  })
  internal!: boolean

  @ApiProperty({
    enum: CaseCommentTypeTitleEnum,
    enumName: 'CaseCommentType',
    example: 'f. 2 dögum',
    description: 'Title of the comment',
  })
  title!: CaseCommentTypeTitleEnum

  @ApiProperty({
    enum: CaseStatusEnum,
    description: 'Case status of when the comment was created.',
  })
  caseStatus!: CaseStatusEnum

  @ApiProperty({
    type: String,
    example: 'f. 2 dögum',
    description: 'String representation of the age of the case comment.',
  })
  age!: string

  @ApiProperty({
    type: String,
    description:
      'ISO date format representation of the age of the case comment.',
  })
  ageIso!: string

  @ApiProperty({
    enum: CaseCommentDirectionEnum,
    enumName: 'CaseCommentDirection',
    description: 'Was the comment sent or received.',
  })
  direction!: CaseCommentDirectionEnum

  @ApiProperty({
    type: String,
    description: 'Who created the comment ',
  })
  creator!: string | null

  @ApiProperty({
    type: String,
    description: 'Who received the comment',
  })
  receiver!: string | null

  @ApiProperty({
    type: String,
    description: 'The comment itself',
  })
  comment!: string | null
}
