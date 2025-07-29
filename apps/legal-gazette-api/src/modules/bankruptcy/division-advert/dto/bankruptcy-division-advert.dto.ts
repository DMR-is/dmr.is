import { Type } from 'class-transformer'
import {
  IsDateString,
  IsDefined,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

import { SettlementDto } from '../../../settlement/dto/settlement.dto'

export class BankruptcyDivisionAdvertDto {
  @ApiProperty({ type: String, required: true })
  @IsDateString()
  meetingDate!: string

  @ApiProperty({ type: String, required: true })
  @IsString()
  @MaxLength(255)
  meetingLocation!: string

  @ApiProperty({ type: SettlementDto, required: true })
  @ValidateNested()
  @Type(() => SettlementDto)
  @IsDefined()
  settlement!: SettlementDto
}
