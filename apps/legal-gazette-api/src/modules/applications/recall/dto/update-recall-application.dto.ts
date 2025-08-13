import { Transform } from 'class-transformer'
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

export class UpdateRecallApplicationDto {
  @ApiProperty({ type: String, required: false, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  additionalText?: string | null

  @ApiProperty({ type: String, required: false, nullable: true })
  @IsOptional()
  @IsDateString()
  @Transform(({ value }) =>
    typeof value === 'string' ? new Date(value) : value,
  )
  judgmentDate?: Date | null

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
  @Transform(({ value }) =>
    typeof value === 'string' ? new Date(value) : value,
  )
  signatureDate?: Date | null

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
  @Transform(({ value }) =>
    typeof value === 'string' ? new Date(value) : value,
  )
  settlementDeadline?: Date | null

  @ApiProperty({ type: String, required: false, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  settlementMeetingLocation?: string | null

  @ApiProperty({ type: String, required: false, nullable: true })
  @IsOptional()
  @IsDateString()
  @Transform(({ value }) =>
    typeof value === 'string' ? new Date(value) : value,
  )
  settlementMeetingDate?: Date | null

  @ApiProperty({ type: String, required: false, nullable: true })
  @IsOptional()
  @IsDateString()
  @Transform(({ value }) =>
    typeof value === 'string' ? new Date(value) : value,
  )
  settlementDateOfDeath?: Date | null

  @ApiProperty({ type: String, required: false, nullable: true })
  @IsOptional()
  @IsUUID()
  courtDistrictId?: string | null

  @ApiProperty({ type: [String], required: false, nullable: true })
  @IsOptional()
  @IsArray()
  @IsDateString(undefined, { each: true })
  @ArrayMaxSize(3)
  @Transform(({ value }) =>
    Array.isArray(value) ? value.map((d) => new Date(d)) : value,
  )
  publishingDates?: Date[] | null
}
