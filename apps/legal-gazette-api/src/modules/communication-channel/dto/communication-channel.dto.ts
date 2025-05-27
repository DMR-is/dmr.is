import { IsEmail, IsOptional, IsString } from 'class-validator'

import { ApiProperty, IntersectionType } from '@nestjs/swagger'

import { DetailedDto } from '@dmr.is/legal-gazette/dto'

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
  name?: string

  @ApiProperty({
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  phone?: string
}

export class CommunicationChannelDto extends CreateCommunicationChannelDto {}

export class CommunicationChannelDetailedDto extends IntersectionType(
  CommunicationChannelDto,
  DetailedDto,
) {}
