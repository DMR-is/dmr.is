import {
  IsDateString,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

export class UpdateCommonAdvertSignatureDto {
  @ApiProperty({
    type: String,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name?: string

  @ApiProperty({
    type: String,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  location?: string

  @ApiProperty({
    type: String,
  })
  @IsOptional()
  @IsDateString()
  date?: string
}

export class UpdateCommonAdvertDto {
  @ApiProperty({
    type: String,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  caption?: string

  @ApiProperty({
    type: String,
  })
  @IsOptional()
  @IsString()
  html?: string

  @ApiProperty({
    type: UpdateCommonAdvertSignatureDto,
  })
  @IsOptional()
  signature?: UpdateCommonAdvertSignatureDto
}
