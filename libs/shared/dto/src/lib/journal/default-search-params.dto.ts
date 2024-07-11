import { Transform } from 'class-transformer'
import { IsOptional, IsString, MaxLength, Min } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'
export class DefaultSearchParams {
  @ApiProperty({
    name: 'search',
    description: 'String to search for',
    type: String,
    required: false,
  })
  @IsOptional()
  @MaxLength(1024)
  @IsString()
  search?: string

  @ApiProperty({
    name: 'page',
    description: 'Page number to return.',
    type: String,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => Number.parseInt(value, 10))
  @Min(1)
  page?: number

  @ApiProperty({
    name: 'pageSize',
    description: 'Page size number to return.',
    type: String,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => Number.parseInt(value, 10))
  @Min(1)
  pageSize?: number
}
