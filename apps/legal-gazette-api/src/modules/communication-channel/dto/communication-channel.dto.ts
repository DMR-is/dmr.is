import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator'

import { ApiProperty, IntersectionType } from '@nestjs/swagger'

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

export class CommunicationChannelDto extends CreateCommunicationChannelDto {}

export class CommunicationChannelDetailedDto extends IntersectionType(
  CommunicationChannelDto,
  DetailedDto,
) {}
