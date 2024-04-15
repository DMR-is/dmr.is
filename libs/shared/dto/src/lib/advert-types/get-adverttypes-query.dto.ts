import { Transform } from 'class-transformer'
import { IsInt, IsOptional, IsPositive, IsString } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

export class GetAdvertTypesQueryParams {
  @ApiProperty({
    name: 'department',
    description: 'Department slug to get categories for.',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  department?: string

  @ApiProperty({
    name: 'search',
    description: 'String to search for in types.',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string

  @ApiProperty({
    name: 'page',
    description: 'Page number to return.',
    type: Number,
    required: false,
  })
  @Transform(({ value }) => Number.parseInt(value, 10))
  @IsInt()
  @IsPositive()
  @IsOptional()
  page?: number
}
