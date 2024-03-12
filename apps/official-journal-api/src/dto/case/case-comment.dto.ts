import { ApiProperty } from '@nestjs/swagger'
import { CaseTask as CaseTaskType } from './case-constants'
import { IsDateString, IsEnum, IsUUID } from 'class-validator'

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
    enum: CaseTaskType,
    example: CaseTaskType.Comment,
    description: 'Type of the case task.',
  })
  @IsEnum(CaseTaskType)
  type!: CaseTaskType

  @ApiProperty({})
  task!: string
}
