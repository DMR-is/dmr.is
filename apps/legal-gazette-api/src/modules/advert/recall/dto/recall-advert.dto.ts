import { Type } from 'class-transformer'
import {
  IsDateString,
  IsDefined,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

import { ApplicationTypeEnum } from '../../../../lib/constants'
import { CourtDistrictDto } from '../../../court-district/dto/court-district.dto'
import { SettlementDto } from '../../../settlement/dto/settlement.dto'

export class RecallAdvertDto {
  @ApiProperty({ type: String, required: true })
  @IsUUID()
  id!: string

  @ApiProperty({ enum: ApplicationTypeEnum })
  @IsEnum(ApplicationTypeEnum)
  type!: ApplicationTypeEnum

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  additionalText?: string

  @ApiProperty({ type: String, required: true })
  @IsDateString()
  judgmentDate!: string

  @ApiProperty({ type: String, required: true })
  @IsString()
  signatureLocation!: string

  @ApiProperty({ type: String, required: true })
  @IsDateString()
  signatureDate!: string

  @ApiProperty({ type: SettlementDto, required: true })
  @ValidateNested()
  @Type(() => SettlementDto)
  @IsDefined()
  settlement!: SettlementDto

  @ApiProperty({ type: CourtDistrictDto, required: true })
  @ValidateNested()
  @Type(() => CourtDistrictDto)
  @IsDefined()
  courtDistrict!: CourtDistrictDto
}
