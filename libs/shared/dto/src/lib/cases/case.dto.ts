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

import { AdvertType } from '../advert-types'
import { CaseComment } from '../case-comments/case-comment.dto'
import { Category } from '../categories'
import { Department } from '../departments/department.dto'
import { CaseTag } from '../tags'
import { User } from '../users/user.dto'
import { CaseChannel } from './case-channel.dto'
import { CaseCommunicationStatus, CaseStatus } from './case-constants'

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
    type: String,
    example: 190,
    description:
      'Case number (numeric string) gets generated automatically when a case is created.',
  })
  @Type(() => String)
  readonly caseNumber!: string

  @ApiProperty({
    enum: CaseStatus,
    example: CaseStatus.Submitted,
    description: 'Status of the case, default to "Innsent"',
  })
  @IsEnum(CaseStatus)
  status!: CaseStatus

  @ApiProperty({
    type: CaseTag,
    description: 'Internal tag for the case, default to null',
  })
  tag!: CaseTag | null

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
    type: Boolean,
    example: false,
    description: 'Is legacy case.',
  })
  @IsBoolean()
  isLegacy!: boolean

  @ApiProperty({
    type: User,
    description: 'User the case is assigned to.',
    nullable: true,
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
    type: String,
    example: '2024-01-01T09:00:00Z',
    description:
      'Date the case was published. ISO 8601 date and time format in UTC.',
  })
  @IsDateString()
  publishedAt!: string | null

  @ApiProperty({
    type: String,
    example: '2024-01-01T09:00:00Z',
    description:
      'Requested advert publication date. ISO 8601 date and time format in UTC.',
  })
  @IsDateString()
  requestedPublicationDate!: string

  @ApiProperty({
    type: String,
    example: 'Titill á máli',
    description: 'Advert title on case',
  })
  @IsString()
  advertTitle!: string

  @ApiProperty({
    type: Department,
    example: 'B-Deild',
    description: 'Advert department',
  })
  @Type(() => Department)
  advertDepartment!: Department

  @ApiProperty({
    type: AdvertType,
    description: 'The advert type',
  })
  advertType!: AdvertType

  @ApiProperty({
    description: 'List of advert categories.',
    required: true,
    type: [Category],
    nullable: false,
  })
  readonly advertCategories!: Category[]

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
    type: String,
    nullable: true,
    example: 'Additional message from sender',
  })
  @IsString()
  @ValidateIf((o) => o.message !== null)
  message!: string | null

  @ApiProperty({
    type: [CaseChannel],
    description: 'Channels for the case.',
    example: {
      id: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
      email: 'dmr@dmr.is',
      phone: '+354 123 4567',
    },
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CaseChannel)
  channels!: CaseChannel[]

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
