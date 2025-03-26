import { Transform } from 'class-transformer'
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator'
import { PagingQuery, SortingQuery } from '@dmr.is/shared/dto'

import { ApiProperty, IntersectionType } from '@nestjs/swagger'

export class CasesQuery {
  @ApiProperty({
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsUUID(4, { each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : value?.split(',')))
  id?: string[]

  @ApiProperty({
    type: String,
    required: false,
  })
  @IsOptional()
  @IsUUID()
  applicationId?: string

  @ApiProperty({
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string

  @ApiProperty({
    type: Number,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  year?: string

  @ApiProperty({
    type: [String],
    required: false,
    description: 'Id, title or slug of the statuses',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : value?.split(',')))
  status?: string[]

  @ApiProperty({
    type: [String],
    required: false,
    description: 'Id, title or slug of the departments',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : value?.split(',')))
  department?: string[]

  @ApiProperty({
    type: [String],
    required: false,
    description: 'Id, title or slug of the types',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : value?.split(',')))
  type?: string[]

  @ApiProperty({
    type: [String],
    required: false,
    description: 'Id, title or slug of the categories',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : value?.split(',')))
  category?: string[]

  @ApiProperty({
    type: String,
    required: false,
  })
  @IsOptional()
  @IsUUID()
  employeeId?: string

  @ApiProperty({
    type: Boolean,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  published?: boolean

  @ApiProperty({
    type: Boolean,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  fastTrack?: boolean

  @ApiProperty({
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  institution?: string

  @ApiProperty({
    type: String,
    required: false,
  })
  @IsOptional()
  @IsDateString()
  fromDate?: string

  @ApiProperty({
    type: String,
    required: false,
  })
  @IsOptional()
  @IsDateString()
  toDate?: string
}

export class GetCasesQuery extends IntersectionType(
  CasesQuery,
  PagingQuery,
  SortingQuery,
) {}
