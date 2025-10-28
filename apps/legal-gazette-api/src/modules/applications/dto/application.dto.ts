import { Transform, Type } from 'class-transformer'
import {
  isBase64,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator'

import {
  ApiProperty,
  IntersectionType,
  OmitType,
  PartialType,
} from '@nestjs/swagger'

import { Paging } from '@dmr.is/shared/dto'

import { CategoryDto } from '../../category/dto/category.dto'
import {
  CommunicationChannelDto,
  CreateCommunicationChannelDto,
  UpdateCommunicationChannelDto,
} from '../../communication-channel/dto/communication-channel.dto'
import { TypeDto } from '../../type/dto/type.dto'
import { ApplicationTypeEnum } from '../application.model'
import { ApplicationStatusEnum } from '../contants'

export class ApplicationSignatureDto {
  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  name?: string

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  onBehalfOf?: string

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  location?: string

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsDateString()
  date?: string
}

export class CommonApplicationFieldsDto {
  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsUUID()
  typeId?: string

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsUUID()
  categoryId?: string

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  caption?: string

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => {
    if (!isBase64(value)) {
      return value
    }

    return Buffer.from(value, 'base64').toString('utf-8')
  })
  html?: string
}

export class ApplicationSettlementDto {
  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  name?: string

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  nationalId?: string

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  address?: string

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsDateString()
  deadlineDate?: string

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsDateString()
  dateOfDeath?: string
}

export class ApplicationDivisionMeetingFieldsDto {
  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsDateString()
  meetingDate?: string

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  meetingLocation?: string
}

export class CourtAndJudgmentFieldsDto {
  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsUUID()
  courtDistrictId?: string

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsDateString()
  judgmentDate?: string
}

export class ApplicationLiquidationFieldsDto {
  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  name?: string

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  location?: string
}

export class ApplicationPublishingDatesDto {
  @ApiProperty({ type: String })
  @IsDateString()
  publishingDate!: string
}

export class ApplicationDto {
  @ApiProperty({ type: String })
  @IsUUID()
  id!: string

  @ApiProperty({ type: String })
  @IsUUID()
  caseId!: string

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsUUID()
  islandIsApplicationId?: string | null

  @ApiProperty({ type: String })
  @IsDateString()
  createdAt!: string

  @ApiProperty({ type: String })
  @IsDateString()
  updatedAt!: string

  @ApiProperty({ type: String })
  @IsString()
  submittedByNationalId!: string

  @ApiProperty({ enum: ApplicationTypeEnum, enumName: 'ApplicationTypeEnum' })
  @IsEnum(ApplicationTypeEnum)
  applicationType!: ApplicationTypeEnum

  @ApiProperty({ type: CategoryDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => CategoryDto)
  category?: CategoryDto

  @ApiProperty({ type: TypeDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => TypeDto)
  type?: TypeDto

  @ApiProperty({
    enum: ApplicationStatusEnum,
    enumName: 'ApplicationStatusEnum',
  })
  @IsEnum(ApplicationStatusEnum)
  status!: ApplicationStatusEnum

  @ApiProperty({ type: String })
  @IsString()
  title!: string
}

export class ApplicationFieldsDto {
  @ApiProperty({ type: CommonApplicationFieldsDto })
  commonFields!: CommonApplicationFieldsDto

  @ApiProperty({ type: ApplicationSettlementDto })
  settlementFields!: ApplicationSettlementDto

  @ApiProperty({ type: ApplicationDivisionMeetingFieldsDto })
  divisionMeetingFields!: ApplicationDivisionMeetingFieldsDto

  @ApiProperty({ type: String, required: false })
  additionalText?: string

  @ApiProperty({ type: CourtAndJudgmentFieldsDto })
  courtAndJudgmentFields!: CourtAndJudgmentFieldsDto

  @ApiProperty({ type: ApplicationLiquidationFieldsDto })
  liquidatorFields!: ApplicationLiquidationFieldsDto

  @ApiProperty({ type: ApplicationSignatureDto })
  signature!: ApplicationSignatureDto

  @ApiProperty({ type: [ApplicationPublishingDatesDto] })
  publishingDates!: ApplicationPublishingDatesDto[]

  @ApiProperty({ type: [CreateCommunicationChannelDto] })
  communicationChannels!: CreateCommunicationChannelDto[]
}

export class ApplicationDetailedDto extends IntersectionType(
  ApplicationDto,
  ApplicationFieldsDto,
) {}

export class UpdateApplicationDto extends PartialType(
  OmitType(ApplicationFieldsDto, ['communicationChannels']),
) {
  @ApiProperty({ type: [CreateCommunicationChannelDto], required: false })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateCommunicationChannelDto)
  communicationChannels?: CreateCommunicationChannelDto[]
}

export class ApplicationsDto extends Paging {
  @ApiProperty({ type: [ApplicationDto] })
  applications!: ApplicationDto[]
}

export class AddDivisionMeetingForApplicationDto {
  @ApiProperty({ type: String })
  @IsDateString()
  meetingDate!: string

  @ApiProperty({ type: String })
  @IsString()
  meetingLocation!: string

  @ApiProperty({ type: ApplicationSignatureDto })
  @ValidateNested()
  @Type(() => ApplicationSignatureDto)
  signature!: ApplicationSignatureDto

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  additionalText?: string

  @ApiProperty({ type: [CreateCommunicationChannelDto], required: false })
  communicationChannels?: CreateCommunicationChannelDto[]
}

export class AddDivisionEndingForApplicationDto extends OmitType(
  AddDivisionMeetingForApplicationDto,
  ['meetingDate', 'meetingLocation'],
) {
  @ApiProperty({ type: String })
  @IsDateString()
  scheduledAt!: string

  @ApiProperty({ type: Number })
  @IsNumber()
  declaredClaims!: number
}
