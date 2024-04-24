import { Type } from 'class-transformer'
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

import { CaseComment } from '../case-comments/case-comment.dto'
import { User } from '../users/user.dto'
import { CaseCommunicationStatus, CaseStatus, CaseTag } from './case-constants'
import { CaseHistory } from './case-history.dto'

export class Case {
  @ApiProperty({
    type: String,
    example: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
  })
  @IsString()
  @IsUUID()
  readonly id!: string

  @ApiProperty({
    type: String,
    example: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
    description:
      'Id of the submitted application, default to null on older cases.',
  })
  @IsUUID()
  readonly applicationId!: string

  @ApiProperty({
    type: Number,
    example: 2024,
    description: 'Year the case was created.',
  })
  @IsNumber()
  @Min(1000)
  @Max(9999)
  year!: number

  @ApiProperty({
    type: Number,
    example: 190,
    description:
      'Case number (numeric string) gets generated automatically when a case is created.',
  })
  @Type(() => Number)
  readonly caseNumber!: number

  @ApiProperty({
    enum: CaseStatus,
    example: CaseStatus.Submitted,
    description: 'Status of the case, default to "Innsent"',
  })
  @IsEnum(CaseStatus)
  status!: CaseStatus

  @ApiProperty({
    enum: CaseTag,
    example: CaseTag.NotStarted,
    description: 'Internal tag for the case, default to null',
  })
  @IsEnum(CaseTag)
  tag!: CaseTag

  @ApiProperty({
    type: [CaseHistory],
    description:
      'Snapshot of the submitted fields, used for tracking changes in the case.',
  })
  history!: CaseHistory[]

  @ApiProperty({
    type: String,
    example: '2024-01-01T09:00:00Z',
    description:
      'Date the case was created. ISO 8601 date and time format in UTC.',
  })
  @IsDateString()
  readonly createdAt!: string

  @ApiProperty({
    type: String,
    example: '2024-01-01T09:00:00Z',
    description:
      'Date when the case was last updated. ISO 8601 date and time format in UTC.',
  })
  @IsDateString()
  modifiedAt!: string

  @ApiProperty({
    type: User,
    description: 'User the case is assigned to.',
  })
  @ValidateIf((o) => o.assignedTo !== null)
  @Type(() => User)
  assignedTo!: User | null

  @ApiProperty({
    enum: CaseCommunicationStatus,
    example: CaseCommunicationStatus.NotStarted,
    description:
      'Status of communication with the applicant, default to `CaseCommunicationStatus.NotStarted`',
  })
  @IsEnum(CaseCommunicationStatus)
  communicationStatus!: CaseCommunicationStatus

  @ApiProperty({
    type: Boolean,
    example: false,
    description: 'Requested fast track',
  })
  @IsBoolean()
  fastTrack!: boolean

  @ApiProperty({
    type: Boolean,
    example: false,
    description: 'Is the case published.',
  })
  @IsBoolean()
  published!: boolean

  @ApiProperty({
    type: String,
    example: '2024-01-01T09:00:00Z',
    description:
      'Date the case was published. ISO 8601 date and time format in UTC.',
  })
  @IsDateString()
  publishedAt!: string | null

  @ApiProperty({
    type: Number,
    example: 23000,
    description: 'The cost of the case.',
  })
  @ValidateIf((o) => o.price !== null)
  @IsNumber()
  price!: number | null

  @ApiProperty({
    type: Boolean,
    example: false,
    description: 'Is the case paid for.',
  })
  @IsBoolean()
  paid!: boolean

  @ApiProperty({
    type: [CaseComment],
    description: 'Comments on the case.',
    example: {
      id: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
      createdAt: '2024-01-01T09:00:00Z',
      type: 'Comment',
      task: {
        from: 'Ármann',
        to: null,
        title: 'gerir athugasemd',
        comment:
          'Pálína, getur þú tekið við og staðfest að upplýsingarnar séu réttar?',
      },
    },
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CaseComment)
  comments!: CaseComment[]
}
