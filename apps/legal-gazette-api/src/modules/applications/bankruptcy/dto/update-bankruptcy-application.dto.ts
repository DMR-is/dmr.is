import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

export class UpdateBankruptcyApplicationDto {
  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  additionalText?: string

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsDateString()
  judgmentDate?: string

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  signatureLocation?: string

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  liquidator?: string

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  liquidatorLocation?: string

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  liquidatorOnBehalfOf?: string

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsDateString()
  signatureDate?: string

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  settlementName?: string

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  settlementAddress?: string

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  settlementNationalId?: string

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsDateString()
  settlementDeadline?: string

  @ApiProperty({ type: String, required: true })
  @IsString()
  @MaxLength(255)
  settlementMeetingLocation?: string

  @ApiProperty({ type: String, required: true })
  @IsDateString()
  settlementMeetingDate?: string

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsUUID()
  courtDistrictId?: string

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsDateString(undefined, { each: true })
  @ArrayMaxSize(3)
  publishingDates?: string[]
}
