import { Type } from 'class-transformer'
import {
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

import { Paging, PagingQuery } from '@dmr.is/shared/dto'

import { DetailedDto } from '../../../dto/detailed.dto'
import { RecallTypeEnum } from '../../../lib/constants'
import { AdvertDetailedDto } from '../../advert/dto/advert.dto'
import { RecallApplicationDto } from '../../applications/recall/dto/recall-application.dto'
import { CommunicationChannelDto } from '../../communication-channel/dto/communication-channel.dto'

export class CaseQueryDto extends PagingQuery {}

export class CreateCaseDto {
  @ApiProperty({ type: String })
  @IsString()
  involvedPartyNationalId!: string
}

export class CaseDto extends DetailedDto {
  @ApiProperty({ type: String })
  @IsUUID()
  id!: string

  @ApiProperty({ type: String })
  @IsString()
  caseNumber!: string

  @ApiProperty({
    enum: RecallTypeEnum,
    required: false,
    enumName: 'RecallTypeEnum',
  })
  applicationType?: RecallTypeEnum
}

export class GetCasesDto {
  @ApiProperty({ type: [CaseDto] })
  @IsArray()
  @Type(() => CaseDto)
  @ValidateNested({ each: true })
  cases!: CaseDto[]

  @ApiProperty({ type: Paging })
  @Type(() => Paging)
  @ValidateNested()
  paging!: Paging
}

export class CaseDetailedDto extends CaseDto {
  @ApiProperty({ type: [CommunicationChannelDto] })
  @IsArray()
  @Type(() => CommunicationChannelDto)
  @ValidateNested({ each: true })
  communicationChannels!: CommunicationChannelDto[]

  @ApiProperty({ type: [AdvertDetailedDto] })
  @IsArray()
  @Type(() => AdvertDetailedDto)
  @ValidateNested({ each: true })
  adverts!: AdvertDetailedDto[]

  @ApiProperty({ type: RecallApplicationDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => RecallApplicationDto)
  bankruptcyApplication?: RecallApplicationDto
}
