import { Type } from 'class-transformer'
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsOptional,
  ValidateNested,
} from 'class-validator'

import { ApiProperty, IntersectionType } from '@nestjs/swagger'

import {
  ApiDateTime,
  ApiDateTimeArray,
  ApiEnum,
  ApiOptionalDateTime,
  ApiOptionalEnum,
  ApiOptionalString,
  ApiString,
  ApiUUId,
} from '@dmr.is/decorators'
import { SettlementType } from '@dmr.is/legal-gazette-schemas'

import { ApplicationRequirementStatementEnum } from '../../../models/application.model'
import { CreateCommunicationChannelDto } from '../../communication-channel/dto/communication-channel.dto'
import { CreateSignatureDto } from '../signature/dto/signature.dto'

export class SharedApplicationFieldsDto {
  @ApiString()
  applicantNationalId!: string

  @ApiOptionalString()
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

  @ApiDateTimeArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(3)
  publishingDates!: Date[]
}

export class CommonAdvertFieldsDto {
  @ApiUUId()
  typeId!: string

  @ApiUUId()
  categoryId!: string

  @ApiString()
  caption!: string

  @ApiString()
  content!: string
}

export class RecallDeceasedCompanyDto {
  @ApiString()
  companyName!: string

  @ApiString()
  companyNationalId!: string
}

export class RecallAdvertFieldsDto {
  @ApiUUId()
  courtDistrictId!: string

  @ApiDateTime()
  judgmentDate!: Date

  @ApiOptionalEnum(SettlementType)
  settlementType?: SettlementType

  @ApiString()
  settlementNationalId!: string

  @ApiString()
  settlementName!: string

  @ApiString()
  settlementAddress!: string

  @ApiDateTime()
  settlementDate!: Date

  @ApiString()
  liquidatorName!: string

  @ApiString()
  liquidatorLocation!: string

  @ApiEnum(ApplicationRequirementStatementEnum)
  requirementStatement!: ApplicationRequirementStatementEnum

  @ApiString()
  requirementStatementLocation!: string

  @ApiProperty({ type: [RecallDeceasedCompanyDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecallDeceasedCompanyDto)
  companies?: RecallDeceasedCompanyDto[]
}

export class RecallDivisionMeetingFieldsDto {
  @ApiDateTime()
  meetingDate!: Date

  @ApiString()
  meetingLocation!: string
}

export class RecallDivisionMeetingOptionalFieldsDto {
  @ApiOptionalDateTime()
  meetingDate?: Date

  @ApiOptionalString()
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

export class CreateRecallDeceasedAdvertAndApplicationDto extends SharedApplicationFieldsDto {
  @ApiProperty({ type: RecallDeceasedFieldsDto })
  @ValidateNested()
  @Type(() => RecallDeceasedFieldsDto)
  fields!: RecallDeceasedFieldsDto
}
