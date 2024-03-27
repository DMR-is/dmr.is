import { Type } from 'class-transformer'
import { IsDateString, IsEnum, IsUUID, ValidateNested } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

import { CaseStatus } from '../cases/case-constants'
import { CaseCommentType } from './case-comment-constants'
import { CaseCommentTask } from './case-comment-task.dto'

export class CaseComment {
  @ApiProperty({
    type: String,
    example: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
    description: 'Id of the case comment.',
  })
  @IsUUID()
  readonly id!: string

  @ApiProperty({
    type: String,
    description:
      'Date and time of the comment, ISO 8601 format, UTC time format.',
    example: '2024-01-01T09:00:00Z',
  })
  @IsDateString()
  readonly createdAt!: string

  @ApiProperty({
    enum: CaseCommentType,
    example: CaseCommentType.Comment,
    description: 'Type of the case task.',
  })
  @IsEnum(CaseCommentType)
  type!: CaseCommentType

  @ApiProperty({
    enum: CaseStatus,
    example: CaseStatus.Submitted,
    description: 'Status of case when comment was added.',
  })
  @IsEnum(CaseStatus)
  caseStatus!: CaseStatus

  @ApiProperty({
    type: CaseCommentTask,
    example: {
      from: 'Ármann',
      to: null,
      title: 'gerir athugasemd',
      comment: `Pálína, getur
      þú tekið við og staðfest að upplýsingarnar séu réttar?`,
    },
    description: 'The task itself',
  })
  @Type(() => CaseCommentTask)
  @ValidateNested()
  task!: CaseCommentTask
}
