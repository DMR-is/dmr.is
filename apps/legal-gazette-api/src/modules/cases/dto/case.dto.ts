import { Type } from 'class-transformer'
import { IsArray, IsOptional, IsUUID } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

import { CreateCommunicationChannelDto } from '../../communication-channel/dto/communication-channel.dto'

export class CreateCaseDto {
  @ApiProperty({ type: String })
  @IsUUID()
  typeId!: string

  @ApiProperty({ type: String })
  @IsUUID()
  categoryId!: string

  @ApiProperty({ type: [CreateCommunicationChannelDto], required: false })
  @IsOptional()
  @IsArray()
  @Type(() => CreateCommunicationChannelDto)
  communicationChannels?: CreateCommunicationChannelDto[]
}
