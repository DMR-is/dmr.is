import { ApiProperty } from '@nestjs/swagger'
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsString,
  IsUUID,
  Length,
  ValidateIf,
  ValidateNested,
} from 'class-validator'
import { CaseNumber } from './case-number.dto'
import { CaseStatus, CaseTag } from './case-constants'
import { CaseInstitution } from './case-institution.dto'
import { JournalAdvert } from '../adverts/journal-advert.dto'
import { Type } from 'class-transformer'
import { CaseComment } from './case-comment.dto'

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
  @ValidateIf((o) => o.applicationId !== null)
  @IsUUID()
  readonly applicationId!: string | null

  @ApiProperty({
    type: CaseNumber,
    example: {
      year: 2024,
      number: 253,
      full: '253/2024',
    },
    description:
      'Case number gets generated automatically when a case is created.',
  })
  @ValidateNested()
  @Type(() => CaseNumber)
  readonly number!: CaseNumber

  @ApiProperty({
    type: String,
    examples: ['2024000000', '20209999'],
    description:
      'Publishing number is generated automatically when a case is published.',
  })
  @IsString()
  @Length(8, 10)
  @ValidateIf((o) => o.publishingNumber !== null)
  publishingNumber!: string | null

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
  @ValidateIf((o) => o.tag !== null)
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
    type: String,
    example: '0102030000',
    description:
      'Someway of identifying the employee who is assigned to the case, defaults to null.',
  })
  @IsString()
  @ValidateIf((o) => o.assignedTo !== null)
  assignedTo!: string | null

  @ApiProperty({
    type: CaseInstitution,
    description: 'The institution that owns the case.',
    example: {
      ssn: '0102030000',
      name: 'Forsætisráðuneytið',
    },
  })
  @ValidateNested()
  @Type(() => CaseInstitution)
  readonly insititution!: CaseInstitution

  @ApiProperty({
    type: JournalAdvert,
    description: 'The advert that is associated with the case.',
  })
  @ValidateNested()
  @Type(() => JournalAdvert)
  readonly advert!: JournalAdvert

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
    example: [
      {
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
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CaseComment)
  comments!: CaseComment[]
}