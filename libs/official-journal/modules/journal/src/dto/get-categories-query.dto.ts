import { Transform } from 'class-transformer'
import { IsNumberString, IsOptional, IsString } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

export class GetCategoriesQueryParams {
  @ApiProperty({
    name: 'search',
    description: 'String to search for in categories.',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string

  @ApiProperty({
    name: 'page',
    description: 'Page number to return.',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsNumberString()
  @Transform(({ value }) => Number.parseInt(value, 10))
  page?: number

  @ApiProperty({
    name: 'pageSize',
    description: 'Page size number to return.',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsNumberString()
  @Transform(({ value }) => Number.parseInt(value, 10))
  pageSize?: number
}
