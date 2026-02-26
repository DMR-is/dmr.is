import { Type } from 'class-transformer'
import {
  IsArray,
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator'

import {
  ApiProperty,
  IntersectionType,
  PartialType,
} from '@nestjs/swagger'

import { ApiOptionalString } from '@dmr.is/decorators'

import { CommunicationChannelDto } from '../../../models/communication-channel.model'
import { DetailedDto } from '../../shared/dto/detailed.dto'

export class CreateCommunicationChannelDto {
  @ApiProperty({ type: String })
  @IsEmail()
  email!: string

  @ApiOptionalString()
  @MinLength(0)
  @MaxLength(255)
  name?: string

  @ApiProperty({
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(0)
  @MaxLength(255)
  phone?: string
}

export class GetCommunicationChannelsDto {
  @ApiProperty({
    type: [CommunicationChannelDto],
  })
  @IsArray()
  @Type(() => CommunicationChannelDto)
  @ValidateNested({ each: true })
  channels!: CommunicationChannelDto[]
}

export class CommunicationChannelDetailedDto extends IntersectionType(
  CommunicationChannelDto,
  DetailedDto,
) {}

export class UpdateCommunicationChannelDto extends PartialType(
  CreateCommunicationChannelDto,
) {}
