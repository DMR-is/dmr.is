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
import { CreateCommunicationChannelDto } from '../../communication-channel/dto/communication-channel.dto'
import { TypeDto } from '../../type/dto/type.dto'
import { ApplicationTypeEnum } from '../application.model'
import {
  ApplicationRequirementStatementEnum,
  ApplicationStatusEnum,
} from '../contants'

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

export class UpdateApplicationSettlementDto extends PartialType(
  ApplicationSettlementDto,
) {}

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

export class UpdateApplicationDivisionMeetingFieldsDto extends PartialType(
  ApplicationDivisionMeetingFieldsDto,
) {}

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

export class UpdateCourtAndJudgmentFieldsDto extends PartialType(
  CourtAndJudgmentFieldsDto,
) {}

export class ApplicationLiquidationFieldsDto {
  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  name?: string

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  location?: string

  @ApiProperty({
    enum: ApplicationRequirementStatementEnum,
    enumName: 'ApplicationRequirementStatementEnum',
    default: ApplicationRequirementStatementEnum.LIQUIDATORLOCATION,
    required: false,
  })
  @IsEnum(ApplicationRequirementStatementEnum)
  @IsOptional()
  recallRequirementStatementType?: ApplicationRequirementStatementEnum

  @ApiProperty({
    type: String,
    required: false,
    description: 'Location to send recall requirement (Kröfulýsing)',
  })
  @IsOptional()
  @IsString()
  recallRequirementStatementLocation?: string
}

export class UpdateApplicationLiquidationFieldsDto extends PartialType(
  ApplicationLiquidationFieldsDto,
) {}

export class ApplicationPublishingDatesDto {
  @ApiProperty({ type: String })
  @IsDateString()
  publishingDate!: string
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

export class RecallFieldsDto {
  @ApiProperty({ type: CourtAndJudgmentFieldsDto })
  courtAndJudgmentFields!: CourtAndJudgmentFieldsDto

  @ApiProperty({ type: ApplicationLiquidationFieldsDto })
  liquidatorFields!: ApplicationLiquidationFieldsDto

  @ApiProperty({ type: ApplicationSettlementDto })
  settlementFields!: ApplicationSettlementDto

  @ApiProperty({ type: ApplicationDivisionMeetingFieldsDto })
  divisionMeetingFields!: ApplicationDivisionMeetingFieldsDto
}

export class UpdateRecallFieldsDto {
  @ApiProperty({ type: UpdateCourtAndJudgmentFieldsDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateCourtAndJudgmentFieldsDto)
  courtAndJudgmentFields?: UpdateCourtAndJudgmentFieldsDto

  @ApiProperty({ type: UpdateApplicationLiquidationFieldsDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateApplicationLiquidationFieldsDto)
  liquidatorFields?: UpdateApplicationLiquidationFieldsDto

  @ApiProperty({ type: UpdateApplicationSettlementDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateApplicationSettlementDto)
  settlementFields?: UpdateApplicationSettlementDto

  @ApiProperty({
    type: UpdateApplicationDivisionMeetingFieldsDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateApplicationDivisionMeetingFieldsDto)
  divisionMeetingFields?: UpdateApplicationDivisionMeetingFieldsDto
}

export class ApplicationDto {
  @ApiProperty({ type: String })
  @IsUUID()
  id?: string

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
  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  additionalText?: string

  @ApiProperty({ type: CommonApplicationFieldsDto })
  commonFields!: CommonApplicationFieldsDto

  @ApiProperty({ type: RecallFieldsDto })
  recallFields!: RecallFieldsDto

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

export class UpdateApplicationDto {
  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  additionalText?: string

  @ApiProperty({ type: CommonApplicationFieldsDto, required: false })
  @IsOptional()
  @Type(() => CommonApplicationFieldsDto)
  @ValidateNested()
  commonFields?: CommonApplicationFieldsDto

  @ApiProperty({ type: UpdateRecallFieldsDto, required: false })
  @IsOptional()
  @Type(() => UpdateRecallFieldsDto)
  @ValidateNested()
  recallFields?: UpdateRecallFieldsDto

  @ApiProperty({ type: ApplicationSignatureDto, required: false })
  @IsOptional()
  @Type(() => ApplicationSignatureDto)
  @ValidateNested()
  signature?: ApplicationSignatureDto

  @ApiProperty({ type: [ApplicationPublishingDatesDto], required: false })
  @IsOptional()
  @Type(() => ApplicationPublishingDatesDto)
  @ValidateNested({ each: true })
  publishingDates?: ApplicationPublishingDatesDto[]

  @ApiProperty({ type: [CreateCommunicationChannelDto], required: false })
  @IsOptional()
  @Type(() => CreateCommunicationChannelDto)
  @ValidateNested({ each: true })
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
