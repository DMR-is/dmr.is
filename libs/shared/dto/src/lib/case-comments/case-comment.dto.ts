import { Type } from 'class-transformer'
import { IsDateString, IsUUID, ValidateNested } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

import { CaseStatus } from '../cases'
import { CaseCommentTask } from './case-comment-task.dto'
import { CaseCommentType } from './case-comment-type.dto'

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
    type: Boolean,
    description: 'Is the comment internal or external.',
    example: false,
  })
  internal!: boolean

  @ApiProperty({
    type: CaseCommentType,
    description: 'Type of the case task.',
  })
  @Type(() => CaseCommentType)
  type!: CaseCommentType

  @ApiProperty({
    type: CaseStatus,
    description: 'Status of case when comment was added.',
  })
  @Type(() => CaseStatus)
  caseStatus!: CaseStatus

  @ApiProperty({
    type: String,
    description: 'JSON state of the application',
  })
  state!: string | null

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
