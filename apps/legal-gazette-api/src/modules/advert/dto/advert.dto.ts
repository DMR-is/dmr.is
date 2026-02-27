import { Transform } from 'class-transformer'
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsUUID,
} from 'class-validator'

import { ApiProperty, OmitType, PartialType, PickType } from '@nestjs/swagger'

import {
  ApiDateTimeArray,
  ApiOptionalBoolean,
  ApiOptionalDateTime,
  ApiOptionalDto,
  ApiOptionalDtoArray,
  ApiOptionalEnum,
  ApiOptionalString,
  ApiOptionalUuid,
  ApiString,
  ApiUUId,
} from '@dmr.is/decorators'
import { Paging } from '@dmr.is/shared-dto'

import {
  AdvertDetailedDto,
  AdvertDto,
  AdvertTemplateType,
  ExternalAdvertDto,
} from '../../../models/advert.model'
import { CategoryDto } from '../../../models/category.model'
import { StatusDto } from '../../../models/status.model'
import { TypeDto } from '../../../models/type.model'
import { CreateCommunicationChannelDto } from '../../communication-channel/dto/communication-channel.dto'
import { CreateSettlementDto } from '../../settlement/dto/settlement.dto'
import { QueryDto } from '../../shared/dto/query.dto'
import { CreateSignatureDto } from '../signature/dto/signature.dto'

export class GetAdvertsDto {
  @ApiProperty({ type: [AdvertDto] })
  adverts!: AdvertDto[]

  @ApiProperty({ type: Paging })
  paging!: Paging
}

export class GetExternalAdvertsDto {
  @ApiProperty({ type: [ExternalAdvertDto] })
  adverts!: ExternalAdvertDto[]
}

export class GetAdvertsQueryDto extends QueryDto {
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

  @ApiProperty({ type: [String], required: false })
  @Transform(({ value }) => {
    if (!value) return undefined
    return Array.isArray(value) ? value : [value]
  })
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  statusId?: string[]

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

  @ApiProperty({ type: [String], required: false })
  @Transform(({ value }) => {
    if (!value) return undefined
    return Array.isArray(value) ? value : [value]
  })
  @IsArray()
  @IsOptional()
  externalId?: string[]
}

export class AdvertTabCountItemDto {
  @ApiProperty({ type: Number })
  count!: number
}

export class GetAdvertsStatusCounterDto {
  @ApiProperty({ type: AdvertTabCountItemDto })
  submittedTab!: AdvertTabCountItemDto

  @ApiProperty({ type: AdvertTabCountItemDto })
  readyForPublicationTab!: AdvertTabCountItemDto

  @ApiProperty({ type: AdvertTabCountItemDto })
  inPublishingTab!: AdvertTabCountItemDto

  @ApiProperty({ type: AdvertTabCountItemDto })
  finishedTab!: AdvertTabCountItemDto
}

export class MyAdvertListItemDto {
  @ApiProperty({ type: String, format: 'uuid' })
  id!: string

  @ApiProperty({ type: String, format: 'uuid', nullable: true })
  legacyId!: string | null

  @ApiProperty({ type: String })
  title!: string

  @ApiProperty({ type: String, nullable: true })
  publicationNumber!: string | null

  @ApiProperty({ type: TypeDto })
  type!: TypeDto

  @ApiProperty({ type: CategoryDto })
  category!: CategoryDto

  @ApiProperty({ type: StatusDto })
  status!: StatusDto

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  publishedAt!: Date | null

  @ApiProperty({ type: String, nullable: true })
  html!: string | null
}

export class GetMyAdvertsDto {
  @ApiProperty({ type: [MyAdvertListItemDto] })
  adverts!: MyAdvertListItemDto[]

  @ApiProperty({ type: Paging })
  paging!: Paging
}

export class CreateAdvertInternalDto {
  @ApiOptionalUuid()
  caseId?: string | null

  @ApiOptionalUuid()
  islandIsApplicationId?: string | null

  @ApiUUId()
  typeId!: string

  @ApiString()
  title!: string

  @ApiUUId()
  categoryId!: string

  @ApiOptionalString({ nullable: true })
  legacyHtml?: string | null

  @ApiString()
  createdBy!: string

  @ApiString()
  createdByNationalId!: string

  @ApiOptionalString()
  additionalText?: string | null

  @ApiOptionalString()
  caption?: string | null

  @ApiOptionalString()
  content?: string | null

  @ApiOptionalUuid()
  courtDistrictId?: string | null

  @ApiOptionalUuid()
  settlementId?: string | null

  @ApiOptionalString()
  divisionMeetingLocation?: string | null

  @ApiOptionalString()
  externalId?: string | null

  @ApiOptionalEnum(AdvertTemplateType, {
    enumName: 'AdvertTemplateType',
    description: 'Template type of the advert',
  })
  templateType?: AdvertTemplateType

  @ApiOptionalBoolean()
  isFromExternalSystem?: boolean

  @ApiOptionalUuid()
  applicationId?: string

  @ApiOptionalDateTime({ description: 'Date of signature' })
  signatureDate?: Date

  @ApiOptionalUuid()
  statusId?: string

  @ApiOptionalDateTime()
  judgementDate?: Date | null

  @ApiOptionalDateTime()
  divisionMeetingDate?: Date | null

  @ApiDateTimeArray({ description: 'List of scheduled publication dates' })
  @ArrayMinSize(1)
  @ArrayMaxSize(3)
  scheduledAt!: Date[]

  @ApiOptionalDto(CreateSignatureDto)
  signature?: CreateSignatureDto

  @ApiOptionalDtoArray(CreateCommunicationChannelDto, {
    description: 'List of communication channels for notifications',
  })
  communicationChannels?: CreateCommunicationChannelDto[]

  @ApiOptionalDto(CreateSettlementDto)
  settlement?: CreateSettlementDto | null
}

export class CreateAdvertDto extends OmitType(CreateAdvertInternalDto, [
  'statusId',
  'createdBy',
  'createdByNationalId',
  'islandIsApplicationId',
] as const) {}

export class UpdateAdvertDto extends PartialType(
  PickType(AdvertDetailedDto, [
    'content',
    'additionalText',
    'caption',
    'divisionMeetingDate',
    'divisionMeetingLocation',
    'judgementDate',
    'title',
  ] as const),
) {
  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(3)
  scheduledAt?: Date[]

  @ApiProperty({
    type: String,
    required: false,
  })
  @IsOptional()
  @IsUUID()
  categoryId?: string

  @ApiProperty({
    type: String,
    required: false,
  })
  @IsOptional()
  @IsUUID()
  typeId?: string

  @ApiProperty({
    type: String,
    required: false,
  })
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

export class CreateAdvertResponseDto {
  @ApiProperty({ type: String })
  id!: string
}
