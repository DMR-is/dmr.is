import { IsDateString, IsEnum, IsString, IsUUID } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

import { DivisionTypeEnum } from '../../../../lib/constants'
import { SettlementDto } from '../../../settlement/dto/settlement.dto'

export class DivisionAdvertDto {
  @ApiProperty({ type: String })
  @IsUUID()
  id!: string

  @ApiProperty({ type: String })
  @IsUUID()
  advertId!: string

  @ApiProperty({ enum: DivisionTypeEnum, required: true, nullable: false })
  @IsEnum(DivisionTypeEnum)
  type!: DivisionTypeEnum

  @ApiProperty({ required: true, nullable: false })
  @IsDateString()
  meetingDate!: Date

  @ApiProperty({ required: true, nullable: false })
  @IsString()
  meetingLocation!: string

  @ApiProperty({ required: true, nullable: false })
  @IsString()
  meetingTime!: string

  @ApiProperty({ required: true, nullable: false })
  @IsString()
  settlement!: SettlementDto
}

export class DivisionMeetingAdvertDto extends DivisionAdvertDto {}

export class DivisionEndingAdvertDto extends DivisionAdvertDto {}
