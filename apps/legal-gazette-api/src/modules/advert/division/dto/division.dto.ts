import { IsDateString, IsEnum, IsString, IsUUID } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

import { RecallTypeEnum } from '../../../../lib/constants'
import { SettlementDto } from '../../../settlement/dto/settlement.dto'

export class DivisionAdvertDto {
  @ApiProperty({ type: String })
  @IsUUID()
  id!: string

  @ApiProperty({ type: String })
  @IsUUID()
  advertId!: string

  @ApiProperty({ enum: RecallTypeEnum, required: true, nullable: false })
  @IsEnum(RecallTypeEnum)
  recallType!: RecallTypeEnum

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
