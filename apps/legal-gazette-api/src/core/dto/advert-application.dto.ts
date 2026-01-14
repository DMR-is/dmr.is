import { Type } from 'class-transformer'
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator'

import { ApiProperty, IntersectionType } from '@nestjs/swagger'

import { ApplicationRequirementStatementEnum } from '../../models/application.model'
import { CreateCommunicationChannelDto } from '../../models/communication-channel.model'
import { CreateSignatureDto } from '../../models/signature.model'

export class SharedApplicationFieldsDto {
  @ApiProperty({ type: String })
  @IsString()
  applicantNationalId!: string

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  additionalText?: string

  @ApiProperty({ type: CreateSignatureDto })
  @ValidateNested()
  @Type(() => CreateSignatureDto)
  signature!: CreateSignatureDto

  @ApiProperty({ type: [CreateCommunicationChannelDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCommunicationChannelDto)
  communicationChannels!: CreateCommunicationChannelDto[]

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsDateString(undefined, { each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(3)
  publishingDates!: string[]
}

export class CommonAdvertFieldsDto {
  @ApiProperty({ type: String })
  @IsUUID()
  typeId!: string

  @ApiProperty({ type: String })
  @IsUUID()
  categoryId!: string

  @ApiProperty({ type: String })
  @IsString()
  caption!: string

  @ApiProperty({ type: String })
  @IsString()
  content!: string
}

export class RecallAdvertFieldsDto {
  @ApiProperty({ type: String })
  @IsUUID()
  courtDistrictId!: string

  @ApiProperty({ type: String })
  @IsDateString()
  judgmentDate!: string

  @ApiProperty({ type: String })
  @IsString()
  settlementNationalId!: string

  @ApiProperty({ type: String })
  @IsString()
  settlementName!: string

  @ApiProperty({ type: String })
  @IsString()
  settlementAddress!: string

  @ApiProperty({ type: String })
  @IsDateString()
  settlementDate!: string

  @ApiProperty({ type: String })
  @IsString()
  liquidatorName!: string

  @ApiProperty({ type: String })
  @IsString()
  liquidatorLocation!: string

  @ApiProperty({ enum: ApplicationRequirementStatementEnum })
  @IsEnum(ApplicationRequirementStatementEnum)
  requirementStatement!: ApplicationRequirementStatementEnum

  @ApiProperty({ type: String })
  @IsString()
  requirementStatementLocation!: string
}

export class RecallDivisionMeetingFieldsDto {
  @ApiProperty({ type: String })
  @IsDateString()
  meetingDate!: string

  @ApiProperty({ type: String })
  @IsString()
  meetingLocation!: string
}

export class RecallDivisionMeetingOptionalFieldsDto {
  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsDateString()
  meetingDate?: string

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  meetingLocation?: string
}

export class RecallBankruptcyFieldsDto extends IntersectionType(
  RecallDivisionMeetingFieldsDto,
  RecallAdvertFieldsDto,
) {}

export class RecallDeceasedFieldsDto extends IntersectionType(
  RecallDivisionMeetingOptionalFieldsDto,
  RecallAdvertFieldsDto,
) {}

export class CreateCommonAdvertAndApplicationDto extends SharedApplicationFieldsDto {
  @ApiProperty({ type: CommonAdvertFieldsDto })
  @ValidateNested()
  @Type(() => CommonAdvertFieldsDto)
  fields!: CommonAdvertFieldsDto
}

export class CreateRecallBankruptcyAdvertAndApplicationDto extends SharedApplicationFieldsDto {
  @ApiProperty({ type: RecallBankruptcyFieldsDto })
  @ValidateNested()
  @Type(() => RecallBankruptcyFieldsDto)
  fields!: RecallBankruptcyFieldsDto
}

export class CreateRecallDeceasedAdvertAndApplicationDto {
  @ApiProperty({ type: RecallDeceasedFieldsDto })
  @ValidateNested()
  @Type(() => RecallDeceasedFieldsDto)
  fields!: RecallDeceasedFieldsDto
}
