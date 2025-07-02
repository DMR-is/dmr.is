import {
  IsDateString,
  IsNumberString,
  IsOptional,
  IsString,
} from 'class-validator'

import { ApiProperty, IntersectionType } from '@nestjs/swagger'

import { PagingQuery } from '../paging'
import { SortingQuery } from '../sorting'

export class GetAdvertsQueryParams {
  @ApiProperty({
    name: 'search',
    description: 'String to search for in adverts.',
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
  @IsOptional()
  @IsNumberString()
  page?: number

  @ApiProperty({
    name: 'pageSize',
    description: 'Page size to return.',
    type: Number,
    required: false,
  })
  @IsOptional()
  @IsNumberString()
  pageSize?: number

  @ApiProperty({
    name: 'department',
    description: 'One or more departments (by `slug`) to filter on.',
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsString()
  department?: string | string[]

  @ApiProperty({
    name: 'year',
    description: 'One or more year (signature year) to filter by.',
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsString()
  year?: string | string[]

  @ApiProperty({
    name: 'type',
    description: 'One or more types (by `slug`) to filter on.',
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsString({ each: true })
  type?: string | string[]

  @ApiProperty({
    name: 'category',
    description: 'One or more categories (by `slug`) to filter on.',
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsString({ each: true })
  category?: string | string[]

  @ApiProperty({
    name: 'involvedParty',
    description: 'One or more involved parties (by `slug`) to filter on.',
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsString({ each: true })
  involvedParty?: string | string[]

  @ApiProperty({
    name: 'dateFrom',
    description:
      'Date from which to filter adverts on, inclusive, takes into account `createdDate`, `updatedDate` and `signatureDate`.',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsDateString()
  dateFrom?: string

  @ApiProperty({
    name: 'dateTo',
    description:
      'Date to which to filter adverts on, inclusive, takes into account `createdDate`, `updatedDate` and `signatureDate`.',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsDateString()
  dateTo?: string
}

export class GetAdvertsQuery extends IntersectionType(
  GetAdvertsQueryParams,
  PagingQuery,
  SortingQuery,
) {}
