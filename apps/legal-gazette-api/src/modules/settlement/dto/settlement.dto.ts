import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateIf,
} from 'class-validator'

import { ApiProperty, PartialType } from '@nestjs/swagger'

export class SettlementDto {
  @ApiProperty({ type: String, required: true })
  @IsUUID()
  id!: string

  @ApiProperty({ type: String, required: true })
  @IsString()
  @MaxLength(255)
  liquidatorName!: string

  @ApiProperty({ type: String, required: true })
  @IsString()
  @MaxLength(255)
  liquidatorLocation!: string

  @ApiProperty({ type: String, required: true })
  @IsString()
  @MaxLength(255)
  settlementName!: string

  @ApiProperty({ type: String, required: true })
  @IsString()
  @MaxLength(255)
  settlementNationalId!: string

  @ApiProperty({ type: String, required: true })
  @IsString()
  @MaxLength(255)
  settlementAddress!: string

  @ApiProperty({ type: Number, required: true })
  @IsNumber()
  declaredClaims!: number | null

  @ApiProperty({ type: String, required: true, nullable: true })
  @ValidateIf((o) => o.settlementDeadline !== null)
  @IsDateString()
  settlementDeadline!: string | null

  @ApiProperty({ type: String, required: false, nullable: true })
  @ValidateIf((o) => o.settlementDateOfDeath !== null)
  @IsDateString()
  settlementDateOfDeath!: string | null

  @ApiProperty({ type: String, required: false })
  @IsString()
  @MaxLength(255)
  @IsOptional()
  liquidatorRecallStatementLocation?: string

  @ApiProperty({ type: String, required: false })
  @IsString()
  @MaxLength(255)
  @IsOptional()
  liquidatorRecallStatementType?: string
}

export class CreateSettlementDto {
  @ApiProperty({ type: String, required: true })
  @IsString()
  @MaxLength(255)
  liquidatorName!: string

  @ApiProperty({ type: String, required: true })
  @IsString()
  @MaxLength(255)
  liquidatorLocation!: string

  @ApiProperty({ type: String, required: false })
  @IsString()
  @MaxLength(255)
  @IsOptional()
  liquidatorRecallStatementLocation?: string

  @ApiProperty({ type: String, required: false })
  @IsString()
  @MaxLength(255)
  @IsOptional()
  liquidatorRecallStatementType?: string

  @ApiProperty({ type: String, required: true })
  @IsString()
  @MaxLength(255)
  settlementName!: string

  @ApiProperty({ type: String, required: true })
  @IsString()
  @MaxLength(255)
  settlementNationalId!: string

  @ApiProperty({ type: String, required: true })
  @IsString()
  @MaxLength(255)
  settlementAddress!: string

  @ApiProperty({ type: Number, required: false })
  @IsOptional()
  @IsNumber()
  declaredClaims?: number

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsDateString()
  settlementDeadline?: string

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsDateString()
  settlementDateOfDeath?: string
}

export class UpdateSettlementDto extends PartialType(SettlementDto) {}
