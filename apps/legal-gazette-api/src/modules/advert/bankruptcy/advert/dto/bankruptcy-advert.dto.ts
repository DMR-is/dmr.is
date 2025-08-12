import { Type } from 'class-transformer'
import {
  IsDateString,
  IsDefined,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

import { CourtDistrictDto } from '../../../../court-district/dto/court-district.dto'
import { SettlementDto } from '../../../../settlement/dto/settlement.dto'

export class BankruptcyAdvertDto {
  @ApiProperty({ type: String, required: true })
  @IsUUID()
  id!: string

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
