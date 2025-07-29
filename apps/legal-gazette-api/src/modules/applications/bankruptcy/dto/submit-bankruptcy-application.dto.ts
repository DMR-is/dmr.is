import { Type } from 'class-transformer'
import {
  IsDateString,
  IsDefined,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

export class BankruptcyApplicationSettlementDto {
  @ApiProperty({ type: String, required: true })
  @IsString()
  @MaxLength(255)
  liquidator!: string

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  onBehalfOfLiquidator?: string

  @ApiProperty({ type: String, required: true })
  @IsString()
  @MaxLength(255)
  liquidatorLocation!: string

  @ApiProperty({ type: String, required: true })
  @IsString()
  @MaxLength(255)
  name!: string

  @ApiProperty({ type: String, required: true })
  @IsString()
  @MaxLength(10)
  nationalId!: string

  @ApiProperty({ type: String, required: true })
  @IsString()
  @MaxLength(255)
  address!: string

  @ApiProperty({ type: String, required: true })
  @IsDateString()
  deadlineDate!: string

  @ApiProperty({ type: String, required: true })
  @IsDateString()
  meetingDate!: string

  @ApiProperty({ type: String, required: true })
  @IsString()
  @MaxLength(255)
  meetingLocation!: string
}

export class BankruptcyApplicationSignatureDto {
  @ApiProperty({ type: String, required: true })
  @IsString()
  @MaxLength(255)
  signatureName!: string

  @ApiProperty({ type: String, required: true })
  @IsString()
  @MaxLength(255)
  signatureLocation!: string
}

export class BankruptcyApplicationDetailsDto {
  @ApiProperty({ type: String, required: true })
  @IsUUID()
  courtDistrictId!: string

  @ApiProperty({ type: String, required: true })
  @IsDateString()
  judgmentDate!: string

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  additionalText?: string
}

export class SubmitBankruptcyApplicationDto {
  @ApiProperty({ type: BankruptcyApplicationDetailsDto, required: true })
  @ValidateNested()
  @Type(() => BankruptcyApplicationDetailsDto)
  @IsDefined()
  details!: BankruptcyApplicationDetailsDto

  @ApiProperty({ type: BankruptcyApplicationSettlementDto, required: true })
  @ValidateNested()
  @Type(() => BankruptcyApplicationSettlementDto)
  @IsDefined()
  settlement!: BankruptcyApplicationSettlementDto

  @ApiProperty({ type: BankruptcyApplicationSignatureDto, required: true })
  @ValidateNested()
  @Type(() => BankruptcyApplicationSignatureDto)
  @IsDefined()
  signature!: BankruptcyApplicationSignatureDto
}
