import { Transform, Type } from 'class-transformer'
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

import { Paging, PagingQuery } from '@dmr.is/shared/dto'

import { DetailedDto } from '../../../dto/detailed.dto'
import { AdvertPublicationDto } from '../../advert-publications/dto/advert-publication.dto'
import { CategoryDto } from '../../category/dto/category.dto'
import { CommentDto } from '../../comment/dto/comment.dto'
import {
  CommunicationChannelDto,
  CreateCommunicationChannelDto,
} from '../../communication-channel/dto/communication-channel.dto'
import { CourtDistrictDto } from '../../court-district/dto/court-district.dto'
import {
  CreateSettlementDto,
  SettlementDto,
} from '../../settlement/dto/settlement.dto'
import { StatusDto } from '../../status/dto/status.dto'
import { StatusIdEnum } from '../../status/status.model'
import { TypeDto } from '../../type/dto/type.dto'

export class AdvertDto extends DetailedDto {
  @ApiProperty({ type: String })
  @IsUUID()
  id!: string

  @ApiProperty({ type: String })
  @IsDateString()
  scheduledAt!: string

  @ApiProperty({ type: CategoryDto })
  @Type(() => CategoryDto)
  @ValidateNested()
  category!: CategoryDto

  @ApiProperty({ type: TypeDto })
  @Type(() => TypeDto)
  @ValidateNested()
  type!: TypeDto

  @ApiProperty({ type: StatusDto })
  @Type(() => StatusDto)
  @ValidateNested()
  status!: StatusDto

  @ApiProperty({ type: String })
  @IsString()
  title!: string

  @ApiProperty({ type: String })
  @IsString()
  createdBy!: string

  @ApiProperty({ type: String, required: false })
  @Type(() => String)
  @ValidateNested()
  assignedUser?: string

  @ApiProperty({ type: [AdvertPublicationDto] })
  publications!: AdvertPublicationDto[]
}

export class AdvertDetailedDto extends AdvertDto {
  @ApiProperty({
    type: String,
    required: false,
  })
  @IsOptional()
  @IsUUID()
  caseId?: string

  @ApiProperty({
    type: Boolean,
  })
  @IsBoolean()
  canEdit!: boolean

  @ApiProperty({
    type: String,
    nullable: true,
  })
  @IsUUID()
  publicationNumber!: string | null

  @ApiProperty({
    type: String,
  })
  @IsString()
  title!: string

  @ApiProperty({
    type: String,
  })
  @IsString()
  createdBy!: string

  @ApiProperty({ type: TypeDto })
  @Type(() => TypeDto)
  @ValidateNested()
  type!: TypeDto

  @ApiProperty({ type: CategoryDto })
  @Type(() => CategoryDto)
  @ValidateNested()
  category!: CategoryDto

  @ApiProperty({ type: StatusDto })
  @Type(() => StatusDto)
  @ValidateNested()
  status!: StatusDto

  @ApiProperty({ type: String, nullable: true })
  content!: string | null

  @ApiProperty({ type: String, nullable: true })
  caption!: string | null

  @ApiProperty({ type: String, nullable: true })
  additionalText!: string | null

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  signatureName?: string

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  signatureLocation?: string

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  signatureOnBehalfOf?: string

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsDateString()
  signatureDate?: string

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsDateString()
  judgementDate?: string

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsDateString()
  divisionMeetingDate?: string

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  divisionMeetingLocation?: string

  @ApiProperty({ type: SettlementDto, required: false })
  @IsOptional()
  settlement?: SettlementDto

  @ApiProperty({ type: CourtDistrictDto, required: false })
  courtDistrict?: CourtDistrictDto

  @ApiProperty({ type: [CommunicationChannelDto] })
  communicationChannels!: CommunicationChannelDto[]

  @ApiProperty({ type: [AdvertPublicationDto] })
  publications!: AdvertPublicationDto[]

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsDateString()
  paidAt?: string

  @ApiProperty({
    type: Number,
    required: false,
  })
  @IsOptional()
  totalPrice?: number

  @ApiProperty({ type: [CommentDto], required: true })
  @IsArray()
  @Type(() => CommentDto)
  @ValidateNested({ each: true })
  comments!: CommentDto[]
}

export class GetAdvertsDto {
  @ApiProperty({
    type: [AdvertDto],
  })
  adverts!: AdvertDto[]

  @ApiProperty({
    type: Paging,
  })
  paging!: Paging
}

export class GetAdvertsQueryDto extends PagingQuery {
  @ApiProperty({
    type: [String],
    required: false,
  })
  @Transform(({ value }) => {
    if (!value) return undefined
    return Array.isArray(value) ? value : [value]
  })
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  categoryId?: string[]

  @ApiProperty({
    enum: StatusIdEnum,
    enumName: 'StatusIdEnum',
    'x-enumNames': [
      'Submitted',
      'ReadyForPublication',
      'Published',
      'Rejected',
      'Withdrawn',
    ],
    isArray: true,
    required: false,
  })
  @Transform(({ value }) => {
    if (!value) return undefined
    return Array.isArray(value) ? value : [value]
  })
  @IsOptional()
  @IsArray()
  @IsEnum(StatusIdEnum, { each: true })
  statusId?: StatusIdEnum[]

  @ApiProperty({
    type: [String],
    required: false,
  })
  @Transform(({ value }) => {
    if (!value) return undefined
    return Array.isArray(value) ? value : [value]
  })
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  typeId?: string[]

  @ApiProperty({
    type: String,
    required: false,
  })
  @IsOptional()
  @IsDateString()
  @Transform(({ value }) => (value ? new Date(value).toISOString() : null))
  dateFrom?: string

  @ApiProperty({
    type: String,
    required: false,
  })
  @IsOptional()
  @IsDateString()
  @Transform(({ value }) => (value ? new Date(value).toISOString() : null))
  dateTo?: string

  @ApiProperty({
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string
}

export class AdvertStatusCounterItemDto {
  @ApiProperty({
    type: StatusDto,
  })
  @Type(() => StatusDto)
  @ValidateNested()
  status!: StatusDto

  @ApiProperty({
    type: Number,
  })
  count!: number
}

export class GetAdvertsStatusCounterDto {
  @ApiProperty({
    type: AdvertStatusCounterItemDto,
  })
  @Type(() => AdvertStatusCounterItemDto)
  @ValidateNested()
  submitted!: AdvertStatusCounterItemDto

  @ApiProperty({
    type: AdvertStatusCounterItemDto,
  })
  @Type(() => AdvertStatusCounterItemDto)
  @ValidateNested()
  readyForPublication!: AdvertStatusCounterItemDto

  @ApiProperty({
    type: AdvertStatusCounterItemDto,
  })
  @Type(() => AdvertStatusCounterItemDto)
  @ValidateNested()
  withdrawn!: AdvertStatusCounterItemDto

  @ApiProperty({
    type: AdvertStatusCounterItemDto,
  })
  @Type(() => AdvertStatusCounterItemDto)
  @ValidateNested()
  rejected!: AdvertStatusCounterItemDto

  @ApiProperty({
    type: AdvertStatusCounterItemDto,
  })
  @Type(() => AdvertStatusCounterItemDto)
  @ValidateNested()
  published!: AdvertStatusCounterItemDto
}

export class UpdateAdvertDto {
  @ApiProperty({
    type: String,
    required: false,
  })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string

  @ApiProperty({
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title?: string

  @ApiProperty({
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  content?: string

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsUUID()
  categoryId?: string

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsUUID()
  typeId?: string

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  additionalText?: string

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  caption?: string

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  signatureName?: string

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  signatureLocation?: string

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  signatureOnBehalfOf?: string

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsDateString()
  signatureDate?: string

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  divisionMeetingLocation?: string

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsDateString()
  divisionMeetingDate?: string

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsDateString()
  judgementDate?: string

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsUUID()
  courtDistrictId?: string
}

export class PublishAdvertsBody {
  @ApiProperty({
    type: [String],
  })
  @IsArray()
  @IsUUID(undefined, { each: true })
  advertIds!: string[]
}

export class CreateAdvertDto {
  @ApiProperty({
    type: String,
    required: false,
    description: 'Unique identifier of the case',
  })
  @IsOptional()
  @IsString()
  caseId?: string

  @ApiProperty({
    type: String,
    required: false,
    nullable: true,
    description: 'Island.is application identifier',
  })
  @IsOptional()
  @IsString()
  islandIsApplicationId?: string | null

  @ApiProperty({ type: String, description: 'Case type identifier' })
  @IsString()
  typeId!: string

  @ApiProperty({ type: String, description: 'Case category identifier' })
  @IsString()
  categoryId!: string

  @ApiProperty({
    type: String,
    required: false,
    description: 'Case status identifier',
  })
  @IsOptional()
  @IsString()
  statusId?: string

  @ApiProperty({ type: String, description: 'Case title' })
  @IsString()
  title!: string

  @ApiProperty({
    type: String,
    required: false,
    description: 'Legacy HTML content',
  })
  @IsOptional()
  @IsString()
  legacyHtml?: string

  @ApiProperty({ type: String, description: 'User who created the case' })
  @IsString()
  createdBy!: string

  @ApiProperty({ type: String, description: 'National ID of the creator' })
  @IsString()
  createdByNationalId!: string

  @ApiProperty({
    type: String,
    description: 'Signature name',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  signatureName?: string | null

  @ApiProperty({
    type: String,
    required: false,
    nullable: true,
    description: 'Signature on behalf of another person',
  })
  @IsOptional()
  @IsString()
  signatureOnBehalfOf?: string | null

  @ApiProperty({
    type: String,
    description: 'Location where the signature was provided',
    nullable: true,
    required: false,
  })
  @IsOptional()
  @IsString()
  signatureLocation?: string | null

  @ApiProperty({
    type: String,
    format: 'date-time',
    description: 'Date of signature',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsDateString()
  signatureDate?: string | null

  // Common specific properties
  @ApiProperty({
    type: String,
    required: false,
    nullable: true,
    description: 'Additional text content',
  })
  @IsOptional()
  @IsString()
  additionalText?: string | null

  @ApiProperty({
    type: String,
    required: false,
    nullable: true,
    description: 'Case caption',
  })
  @IsOptional()
  @IsString()
  caption?: string | null

  @ApiProperty({
    type: String,
    required: false,
    nullable: true,
    description: 'Case content',
  })
  @IsOptional()
  @IsString()
  content?: string | null

  // Recall specific properties
  @ApiProperty({
    type: String,
    required: false,
    nullable: true,
    description: 'Court district identifier',
  })
  @IsOptional()
  @IsString()
  courtDistrictId?: string | null

  @ApiProperty({
    type: String,
    required: false,
    nullable: true,
    description: 'Settlement identifier',
  })
  @IsOptional()
  @IsString()
  settlementId?: string | null

  @ApiProperty({
    type: String,
    format: 'date-time',
    required: false,
    nullable: true,
    description: 'Date of judgement',
  })
  @IsOptional()
  @IsDateString()
  judgementDate?: string | null

  @ApiProperty({ type: String })
  @IsOptional()
  @IsDateString()
  divisionMeetingDate?: string | null

  @ApiProperty({
    type: String,
    required: false,
    nullable: true,
    description: 'Location of the division meeting',
  })
  @IsOptional()
  @IsString()
  divisionMeetingLocation?: string | null

  @ApiProperty({
    type: [String],
    description: 'List of scheduled publication dates',
  })
  @IsArray()
  @IsDateString(undefined, { each: true })
  @MinLength(1, { each: true })
  @MaxLength(3, { each: true })
  scheduledAt!: string[]

  @ApiProperty({
    type: [CreateCommunicationChannelDto],
    description: 'List of communication channels for notifications',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCommunicationChannelDto)
  communicationChannels?: CreateCommunicationChannelDto[]

  @ApiProperty({
    type: CreateSettlementDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateSettlementDto)
  settlement?: CreateSettlementDto | null
}
