import { Transform, Type } from 'class-transformer'
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator'
import { Department } from '@dmr.is/official-journal/modules/department'
import { TBRTransaction } from '@dmr.is/official-journal/modules/price'
import {
  BaseEntity,
  Paging,
  PagingQuery,
  SortingQuery,
} from '@dmr.is/shared/dto'

import {
  ApiProperty,
  IntersectionType,
  OmitType,
  PartialType,
  PickType,
} from '@nestjs/swagger'

import { AdvertCorrection } from '../advert-correction/advert-correction.dto'
import { ApplicationAttachment } from '../attachments/application-attachment.dto'
import { CaseAddition } from '../case-addition/case-addition.dto'
import { CaseChannel } from '../case-channel/case-channel.dto'
import { CaseHistory } from '../case-history/case-history.dto'
import { CaseStatus } from '../case-status/case-status.dto'
import { CaseTag } from '../case-tag/case-tag.dto'
import { Category } from '../category/category.dto'
import { CommentDto } from '../comment/comment.dto'
import { CommunicationStatus } from '../communication-status/communication-status.dto'
import { InstitutionDto } from '../institution/institution.dto'
import { Signature } from '../signature/signature.dto'
import { UserDto } from '../user/user.dto'

export class CasesQuery {
  @ApiProperty({
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsUUID(4, { each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : value?.split(',')))
  id?: string[]

  @ApiProperty({
    type: String,
    required: false,
  })
  @IsOptional()
  @IsUUID()
  applicationId?: string

  @ApiProperty({
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string

  @ApiProperty({
    type: Number,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  year?: string

  @ApiProperty({
    type: [String],
    required: false,
    description: 'Id, title or slug of the statuses',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : value?.split(',')))
  status?: string[]

  @ApiProperty({
    type: [String],
    required: false,
    description: 'Id, title or slug of the departments',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : value?.split(',')))
  department?: string[]

  @ApiProperty({
    type: [String],
    required: false,
    description: 'Id, title or slug of the types',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : value?.split(',')))
  type?: string[]

  @ApiProperty({
    type: [String],
    required: false,
    description: 'Id, title or slug of the categories',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : value?.split(',')))
  category?: string[]

  @ApiProperty({
    type: String,
    required: false,
  })
  @IsOptional()
  @IsUUID()
  employeeId?: string

  @ApiProperty({
    type: Boolean,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  published?: boolean

  @ApiProperty({
    type: Boolean,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  fastTrack?: boolean

  @ApiProperty({
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  institution?: string

  @ApiProperty({
    type: String,
    required: false,
  })
  @IsOptional()
  @IsDateString()
  fromDate?: string

  @ApiProperty({
    type: String,
    required: false,
  })
  @IsOptional()
  @IsDateString()
  toDate?: string
}

export class GetCasesQuery extends IntersectionType(
  CasesQuery,
  PagingQuery,
  SortingQuery,
) {}

export class CaseDetailed {
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
    description: 'Id of the advert the case is related to.',
    nullable: true,
  })
  @IsString()
  @IsUUID()
  advertId?: string

  @ApiProperty({
    type: String,
    example: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
    description:
      'Id of the submitted application, default to null on older cases.',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  readonly applicationId?: string

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
    type: CaseStatus,
    description: 'Status of the case, default to "Innsent"',
  })
  @Type(() => CaseStatus)
  status!: CaseStatus

  @ApiProperty({
    type: CaseTag,
    description: 'Internal tag for the case, default to null',
  })
  tag!: CaseTag | null

  @ApiProperty({
    type: InstitutionDto,
    description: 'Involved party of the case.',
  })
  @Type(() => InstitutionDto)
  involvedParty!: InstitutionDto

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
    type: UserDto,
    description: 'User the case is assigned to.',
    nullable: true,
  })
  @ValidateIf((o) => o.assignedTo !== null)
  @Type(() => UserDto)
  assignedTo!: UserDto | null

  @ApiProperty({
    type: CommunicationStatus,
    description:
      'Status of communication with the applicant, default to `CaseCommunicationStatus.NotStarted`',
  })
  communicationStatus!: CommunicationStatus

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
    type: BaseEntity,
    description: 'The advert type',
  })
  advertType!: BaseEntity

  @ApiProperty({
    description: 'List of advert categories.',
    required: true,
    type: [Category],
    nullable: false,
  })
  readonly advertCategories!: Category[]

  @ApiProperty({
    description: 'Case fee transaction.',
    required: true,
    type: TBRTransaction,
    nullable: true,
  })
  readonly transaction?: TBRTransaction

  @ApiProperty({
    type: String,
    nullable: true,
    example: 'Additional message from sender',
  })
  @IsString()
  @ValidateIf((o) => o.message !== null)
  message!: string | null

  @ApiProperty({
    type: String,
    description: 'The case html content.',
  })
  @IsString()
  html!: string

  @ApiProperty({
    type: String,
    description: 'Publication number of the case.',
  })
  @IsString()
  @ValidateIf((o) => o.publicationNumber !== null)
  publicationNumber!: string | null

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
    type: () => [CommentDto],
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
  @Type(() => CommentDto)
  comments!: CommentDto[]

  @ApiProperty({
    type: Signature,
  })
  signature!: Signature

  @ApiProperty({
    type: [ApplicationAttachment],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ApplicationAttachment)
  attachments!: ApplicationAttachment[]

  @ApiProperty({
    type: [CaseAddition],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CaseAddition)
  additions!: CaseAddition[]

  @ApiProperty({
    type: [AdvertCorrection],
    description: 'Corrections made to the related advert.',
    required: false,
  })
  @ValidateNested({ each: true })
  @Type(() => AdvertCorrection)
  @IsArray()
  @IsOptional()
  readonly advertCorrections?: AdvertCorrection[]

  @ApiProperty({
    type: [CaseHistory],
    description: 'History of the case.',
  })
  @ValidateNested({ each: true })
  @Type(() => CaseHistory)
  @IsArray()
  history!: CaseHistory[]
}

export class Case extends PickType(CaseDetailed, [
  'id',
  'communicationStatus',
  'requestedPublicationDate',
  'status',
  'year',
  'createdAt',
  'advertDepartment',
  'advertType',
  'advertTitle',
  'advertCategories',
  'fastTrack',
  'assignedTo',
  'tag',
  'involvedParty',
  'publicationNumber',
  'publishedAt',
]) {}

export class GetCasesReponse {
  @ApiProperty({
    type: [Case],
  })
  cases!: Case[]

  @ApiProperty({
    description: 'Paging info',
    type: Paging,
  })
  paging!: Paging
}

export class GetCaseResponse {
  @ApiProperty({
    type: CaseDetailed,
  })
  case!: CaseDetailed
}

export class CreateCaseDto {
  @ApiProperty({
    type: String,
  })
  @IsUUID()
  involvedPartyId!: string

  @ApiProperty({
    type: String,
    required: false,
  })
  @IsOptional()
  @IsUUID()
  applicationId?: string

  @ApiProperty({
    type: String,
  })
  @IsUUID()
  departmentId!: string

  @ApiProperty({
    type: String,
  })
  @IsUUID()
  typeId!: string

  @ApiProperty({
    type: String,
  })
  @IsString()
  subject!: string

  @ApiProperty({
    type: [String],
    required: false,
  })
  categoryIds?: string[]
  @ApiProperty({
    type: String,
    required: false,
  })
  requestedPublicationDate?: string

  @ApiProperty({
    type: String,
    required: false,
  })
  caseStatusId?: string

  @ApiProperty({
    type: String,
    required: false,
  })
  communicationStatusId?: string

  @ApiProperty({
    type: String,
    required: false,
  })
  html?: string

  @ApiProperty({
    type: String,
    required: false,
  })
  message?: string
}

export class CreateCaseResponseDto {
  @ApiProperty({
    type: String,
  })
  id!: string
}

export class UpdateCaseBody extends PartialType(
  OmitType(CreateCaseDto, ['categoryIds', 'message']),
) {
  @ApiProperty({
    type: Boolean,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  fastTrack?: boolean

  @ApiProperty({
    type: String,
    required: false,
  })
  assignedUserId?: string
}
