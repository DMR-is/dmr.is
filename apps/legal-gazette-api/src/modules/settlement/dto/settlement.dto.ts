import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

export class SettlementDto {
  @ApiProperty({ type: String, required: true })
  @IsString()
  @MaxLength(255)
  liquidatorName!: string

  @ApiProperty({ type: String, required: true })
  @IsString()
  @MaxLength(255)
  liquidatorLocation!: string

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  liquidatorOnBehalfOf?: string

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

  @ApiProperty({ type: String, required: true })
  @IsDateString()
  settlementDeadline!: Date
}
