import { Transform } from 'class-transformer'
import {
  IsBooleanString,
  IsDateString,
  IsNumberString,
  IsOptional,
  IsString,
} from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

export class GetCasesQuery {
  @ApiProperty({
    name: 'id',
    type: String,
    description: 'ID of the case to get.',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value
    }
    return value?.split(',')
  })
  id?: string[]

  @ApiProperty({
    name: 'search',
    type: String,
    description: 'String to search for in cases.',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string

  @ApiProperty({
    name: 'id',
    type: String,
    description: 'Application ID',
    required: false,
  })
  @IsOptional()
  @IsString()
  applicationId?: string

  @ApiProperty({
    name: 'year',
    type: String,
    description: 'Year',
    required: false,
  })
  @IsOptional()
  @IsNumberString()
  year?: string

  @ApiProperty({
    name: 'page',
    type: String,
    description: 'Page number',
    required: false,
  })
  @IsOptional()
  @IsNumberString()
  page?: string

  @ApiProperty({
    name: 'pageSize',
    type: String,
    description: 'Page size',
    required: false,
  })
  @IsOptional()
  @IsNumberString()
  pageSize?: string

  @ApiProperty({
    name: 'caseNumber',
    description:
      'Case number to filter on, takes into account `caseNumber` on `Case`.',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  caseNumber?: string

  @ApiProperty({
    name: 'status',
    type: String,
    description:
      'Case status id to filter cases on, takes into account `status` on `Case`.',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value
    }
    return value?.split(',')
  })
  status?: string[]

  @ApiProperty({
    name: 'employeeId',
    description:
      'Id of the employee to filter cases on, takes into account `employeeId` on `Case` and `CaseComment`.',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  employeeId?: string

  @ApiProperty({
    name: 'published',
    description:
      'Boolean to filter cases on, takes into account `published` on `Case`.',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsBooleanString()
  published?: string

  @ApiProperty({
    name: 'fastTrack',
    description:
      'Boolean to filter cases on, takes into account `fastTrack` on `Case`.',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsBooleanString()
  fastTrack?: string

  @ApiProperty({
    name: 'institution',
    description:
      'Institution to filter cases on, takes into account `institution` on `Case`.',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  institution?: string

  @ApiProperty({
    name: 'dateFrom',
    description:
      'Date from which to filter adverts on, inclusive, takes into account `createdDate`, `updatedDate` and `signatureDate`.',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsDateString()
  fromDate?: string

  @ApiProperty({
    name: 'dateTo',
    description:
      'Date to which to filter adverts on, inclusive, takes into account `createdDate`, `updatedDate` and `signatureDate`.',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsDateString()
  toDate?: string

  @ApiProperty({
    name: 'department',
    description:
      'Department slug to filter cases on, takes into account `department` on `Advert`.',
    type: String,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value
    }
    return value?.split(',')
  })
  department?: string[]

  @ApiProperty({
    name: 'type',
    description:
      'Type slug to filter cases on, takes into account `type` on `Advert`.',
    type: String,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value
    }
    return value?.split(',')
  })
  type?: string[]

  @ApiProperty({
    name: 'category',
    description:
      'Category slug to filter cases on, takes into account `category` on `Advert`.',
    type: String,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value
    }
    return value?.split(',')
  })
  category?: string[]
}
