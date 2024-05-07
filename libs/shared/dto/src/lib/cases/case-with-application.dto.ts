import { Type } from 'class-transformer'
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsUUID,
  ValidateIf,
  ValidateNested,
} from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

import { AdvertType } from '../advert-types/advert-type.dto'
import { CaseComment } from '../case-comments/case-comment.dto'
import { Category } from '../categories/category.dto'
import { Department } from '../departments/department.dto'
import { User } from '../users/user.dto'
import { CaseCommunicationStatus, CaseStatus, CaseTag } from './case-constants'

export class CaseWithApplication {
  @ApiProperty({
    type: String,
    example: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
  })
  @IsUUID()
  readonly caseId!: string

  @ApiProperty({
    type: String,
    example: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
  })
  @IsUUID()
  readonly applicationId!: string

  @ApiProperty({
    type: String,
    example: '244',
  })
  readonly publicationNumber!: string | null

  @ApiProperty({
    type: Boolean,
    example: true,
  })
  readonly fastTrack!: boolean

  @ApiProperty({
    enum: CaseCommunicationStatus,
    example: CaseCommunicationStatus.Done,
  })
  @IsEnum(CaseCommunicationStatus)
  readonly communicationStatus!: CaseCommunicationStatus

  @ApiProperty({
    type: String,
    description: 'Full advert document html',
    example: '<p>GJALDSKRÁ fyrir hundahald í Reykjavíkurborg.</p>',
  })
  readonly document!: string

  @ApiProperty({
    enum: CaseStatus,
    example: CaseStatus.InProgress,
  })
  @IsEnum(CaseStatus)
  readonly caseStatus!: CaseStatus

  @ApiProperty({
    enum: CaseTag,
    example: CaseTag.InReview,
  })
  @IsEnum(CaseTag)
  readonly tag!: CaseTag | null

  @ApiProperty({
    type: String,
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsDateString()
  readonly requestedPublicationDate!: string

  @ApiProperty({
    type: String,
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsDateString()
  readonly createdDate!: string

  @ApiProperty({
    type: String,
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsDateString()
  readonly publishDate!: string | null

  @ApiProperty({
    type: Department,
    example: 'GJALDSKRÁ',
  })
  readonly advertDepartment!: Department

  @ApiProperty({
    type: String,
    example: 'GJALDSKRÁ fyrir hundahald í Reykjavíkurborg.',
  })
  readonly advertTitle!: string

  @ApiProperty({
    type: User,
    description: 'User the case is assigned to.',
  })
  @ValidateIf((o) => o.assignedTo !== null)
  @Type(() => User)
  assignedTo!: User | null

  @ApiProperty({
    type: String,
    example: 'Reykjavíkurborg',
  })
  institutionTitle!: string | null

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
  caseComments!: CaseComment[]

  @ApiProperty({
    type: Boolean,
    example: false,
    description: 'Is legacy case.',
  })
  @IsBoolean()
  isLegacy!: boolean

  @ApiProperty({
    description:
      'Date the advert was signed, can be null. ISO 8601 date and time format in UTC.',
    required: true,
    nullable: true,
    type: String,
    example: '2024-01-10T16:00:00Z',
  })
  readonly signatureDate!: string | null

  @ApiProperty({
    description: 'Type of the advert.',
    example: 'GJALDSKRÁ',
    required: true,
    type: AdvertType,
  })
  readonly advertType!: AdvertType | null

  @ApiProperty({
    description: 'List of advert categories.',
    required: true,
    type: [Category],
    nullable: false,
  })
  readonly categories!: Category[]

  @ApiProperty({
    type: Boolean,
    example: false,
    description: 'Is the case paid for.',
  })
  @IsBoolean()
  paid!: boolean

  @ApiProperty({
    type: Number,
    example: 23000,
    description: 'The cost of the case.',
  })
  @ValidateIf((o) => o.price !== null)
  @IsNumber()
  price!: number | null
}
