import { Transform } from 'class-transformer'
import {
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

export class GetAdvertTypesQueryParams {
  @ApiProperty({
    name: 'department',
    description: 'Department slug to get categories for.',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsUUID()
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

  @ApiProperty({
    name: 'pageSize',
    description: 'Number of items per page.',
    type: Number,
    required: false,
  })
  @Transform(({ value }) => Number.parseInt(value, 10))
  @IsInt()
  @IsPositive()
  @IsOptional()
  pageSize?: number
}
