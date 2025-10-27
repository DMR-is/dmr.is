import { Type } from 'class-transformer'
import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
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

export class ApplicationDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  createdAt!: string

  @ApiProperty({ type: String })
  updatedAt!: string

  @ApiProperty({ type: String })
  caseId!: string

  @ApiProperty({ type: String })
  nationalId!: string

  @ApiProperty({ enum: ApplicationTypeEnum, enumName: 'ApplicationTypeEnum' })
  applicationType!: ApplicationTypeEnum

  @ApiProperty({ type: CategoryDto, required: false })
  category?: CategoryDto

  @ApiProperty({ type: TypeDto, required: false })
  type?: TypeDto

  @ApiProperty({ enum: ApplicationStatusEnum })
  status!: ApplicationStatusEnum

  @ApiProperty({ type: String })
  title!: string
}

export class ApplicationFieldsDto {
  @ApiProperty({ type: String, required: false, nullable: true })
  typeId?: string | null

  @ApiProperty({ type: String, required: false, nullable: true })
  categoryId?: string | null

  @ApiProperty({ type: String, required: false, nullable: true })
  courtDistrictId?: string | null

  @ApiProperty({ type: String, required: false, nullable: true })
  islandIsApplicationId?: string | null

  @ApiProperty({ type: String, required: false, nullable: true })
  caption?: string | null

  @ApiProperty({ type: String, required: false, nullable: true })
  additionalText?: string | null

  @ApiProperty({ type: String, required: false, nullable: true })
  judgmentDate?: string | null

  @ApiProperty({ type: String, required: false, nullable: true })
  html?: string | null

  @ApiProperty({ type: ApplicationSignatureDto })
  @ValidateNested()
  @Type(() => ApplicationSignatureDto)
  signature!: ApplicationSignatureDto

  @ApiProperty({ type: String, required: false, nullable: true })
  liquidatorName?: string | null

  @ApiProperty({ type: String, required: false, nullable: true })
  liquidatorLocation?: string | null

  @ApiProperty({ type: String, required: false, nullable: true })
  liquidatorOnBehalfOf?: string | null

  @ApiProperty({ type: String, required: false, nullable: true })
  settlementName?: string | null

  @ApiProperty({ type: String, required: false, nullable: true })
  settlementNationalId?: string | null

  @ApiProperty({ type: String, required: false, nullable: true })
  settlementAddress?: string | null

  @ApiProperty({ type: String, required: false, nullable: true })
  settlementDeadlineDate?: string | null

  @ApiProperty({ type: String, required: false, nullable: true })
  settlementDateOfDeath?: string | null

  @ApiProperty({ type: String, required: false, nullable: true })
  divisionMeetingDate?: string | null

  @ApiProperty({ type: String, required: false, nullable: true })
  divisionMeetingLocation?: string | null

  @ApiProperty({ type: [String] })
  publishingDates!: string[]

  @ApiProperty({ type: [CommunicationChannelDto] })
  communicationChannels!: CommunicationChannelDto[]
}

export class ApplicationDetailedDto extends IntersectionType(
  ApplicationDto,
  ApplicationFieldsDto,
) {}

export class UpdateApplicationDto extends PartialType(ApplicationFieldsDto) {}

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

  @ApiProperty({ type: ApplicationSignatureDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => ApplicationSignatureDto)
  signature?: ApplicationSignatureDto

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
