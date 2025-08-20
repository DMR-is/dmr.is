import { Transform } from 'class-transformer'
import {
  IsArray,
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

export class UpdateCommonApplicationDto {
  @ApiProperty({ type: String, required: false, nullable: true })
  @IsOptional()
  @IsString()
  caption?: string | null

  @ApiProperty({ type: String, required: false, nullable: true })
  @IsOptional()
  @IsString()
  signatureName?: string | null

  @ApiProperty({ type: String, required: false, nullable: true })
  @IsOptional()
  @IsString()
  signatureLocation?: string | null

  @ApiProperty({ type: String, required: false, nullable: true })
  @IsOptional()
  @IsDateString()
  signatureDate?: string | null

  @ApiProperty({ type: String, required: false, nullable: true })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => {
    if (!value) {
      return value
    }

    const html = Buffer.from(value, 'base64').toString('utf-8')

    return html
  })
  html?: string | null

  @ApiProperty({ type: String, required: false, nullable: true })
  @IsOptional()
  @IsUUID()
  categoryId?: string | null

  @ApiProperty({ type: [String], required: false, nullable: true })
  @IsOptional()
  @IsArray()
  @IsDateString(undefined, { each: true })
  publishingDates?: string[] | null
}
