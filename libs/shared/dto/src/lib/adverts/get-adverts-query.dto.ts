import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

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
  @IsNumber()
  page?: number

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
    type: Date,
    required: false,
  })
  @IsOptional()
  @IsDateString()
  dateFrom?: Date

  @ApiProperty({
    name: 'dateTo',
    description:
      'Date to which to filter adverts on, inclusive, takes into account `createdDate`, `updatedDate` and `signatureDate`.',
    type: Date,
    required: false,
  })
  @IsOptional()
  @IsDateString()
  dateTo?: Date
}
