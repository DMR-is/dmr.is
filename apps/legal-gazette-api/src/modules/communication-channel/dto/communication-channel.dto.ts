import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator'

import { ApiProperty, PartialType } from '@nestjs/swagger'

import { ApiOptionalString } from '@dmr.is/decorators'

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

export class UpdateCommunicationChannelDto extends PartialType(
  CreateCommunicationChannelDto,
) {}
