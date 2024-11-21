import { Transform } from 'class-transformer'
import {
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateIf,
} from 'class-validator'
import { DEFAULT_PAGE_NUMBER, DEFAULT_PAGE_SIZE } from '@dmr.is/constants'

import { ApiProperty } from '@nestjs/swagger'

export class AdvertTypeQuery {
  @ApiProperty({
    type: String,
    required: false,
    description: 'Search by id',
  })
  @IsOptional()
  @ValidateIf((o) => o.id)
  @IsUUID()
  id?: string

  @ApiProperty({
    type: String,
    required: false,
    description: 'Search by title',
  })
  @IsOptional()
  @IsString()
  search?: string

  @ApiProperty({
    type: String,
    required: false,
    description: 'Search by slug',
  })
  @IsOptional()
  @IsString()
  slug?: string

  @ApiProperty({
    type: String,
    required: false,
    description: 'Search by department slug, title or id',
  })
  @IsOptional()
  @IsString()
  department?: string

  @ApiProperty({
    type: Number,
    required: false,
    description: 'The page number',
  })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => (value ? parseInt(value, 10) : DEFAULT_PAGE_NUMBER))
  page!: number

  @ApiProperty({
    type: Number,
    required: false,
    description: 'The page size',
  })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => (value ? parseInt(value, 10) : DEFAULT_PAGE_SIZE))
  pageSize!: number
}
