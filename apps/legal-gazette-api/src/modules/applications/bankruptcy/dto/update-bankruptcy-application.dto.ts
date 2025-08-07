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
  @ApiProperty({ type: String, required: false, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  additionalText?: string | null

  @ApiProperty({ type: String, required: false, nullable: true })
  @IsOptional()
  @IsDateString()
  judgmentDate?: string | null

  @ApiProperty({ type: String, required: false, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  signatureLocation?: string | null

  @ApiProperty({ type: String, required: false, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  liquidator?: string | null

  @ApiProperty({ type: String, required: false, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  liquidatorLocation?: string | null

  @ApiProperty({ type: String, required: false, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  liquidatorOnBehalfOf?: string | null

  @ApiProperty({ type: String, required: false, nullable: true })
  @IsOptional()
  @IsDateString()
  signatureDate?: string | null

  @ApiProperty({ type: String, required: false, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  settlementName?: string | null

  @ApiProperty({ type: String, required: false, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  settlementAddress?: string | null

  @ApiProperty({ type: String, required: false, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  settlementNationalId?: string | null

  @ApiProperty({ type: String, required: false, nullable: true })
  @IsOptional()
  @IsDateString()
  settlementDeadline?: string | null

  @ApiProperty({ type: String, required: false, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  settlementMeetingLocation?: string | null

  @ApiProperty({ type: String, required: false, nullable: true })
  @IsOptional()
  @IsDateString()
  settlementMeetingDate?: string | null

  @ApiProperty({ type: String, required: false, nullable: true })
  @IsOptional()
  @IsUUID()
  courtDistrictId?: string | null

  @ApiProperty({ type: [String], required: false, nullable: true })
  @IsOptional()
  @IsArray()
  @IsDateString(undefined, { each: true })
  @ArrayMaxSize(3)
  publishingDates?: string[] | null
}
