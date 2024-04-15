import { ApiProperty } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator'

export class JournalGetAdvertsQueryParams {
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
  @Transform(({ value }) => Number.parseInt(value, 10))
  @IsInt()
  @IsPositive()
  @IsOptional()
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
