import { Type } from 'class-transformer'
import {
  IsArray,
  IsEmail,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator'

import { ApiProperty, IntersectionType, PartialType } from '@nestjs/swagger'

import { DetailedDto } from '../../../dto/detailed.dto'

export class CreateCommunicationChannelDto {
  @ApiProperty({
    type: String,
  })
  @IsEmail()
  email!: string

  @ApiProperty({
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name?: string

  @ApiProperty({
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  phone?: string
}

export class CommunicationChannelDto extends CreateCommunicationChannelDto {
  @ApiProperty({ type: String })
  @IsUUID()
  id!: string

  @ApiProperty({ type: String })
  @IsUUID()
  advertId!: string
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
