import {
  IsBooleanString,
  IsDateString,
  IsNumberString,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

import { CaseStatus } from './case-constants'

export class GetCasesQuery {
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
    type: Number,
    description: 'Year',
    required: false,
  })
  @IsOptional()
  @IsNumberString()
  year?: number

  @ApiProperty({
    name: 'page',
    type: Number,
    description: 'Page number',
    required: false,
  })
  @IsOptional()
  @IsNumberString()
  page?: number

  @ApiProperty({
    name: 'pageSize',
    type: Number,
    description: 'Page size',
    required: false,
  })
  @IsOptional()
  @IsNumberString()
  pageSize?: number

  @ApiProperty({
    name: 'caseNumber',
    description:
      'Case number to filter on, takes into account `caseNumber` on `Case`.',
    type: Number,
    required: false,
  })
  @IsOptional()
  @IsString()
  caseNumber?: number

  @ApiProperty({
    name: 'status',
    description:
      'Case status id to filter cases on, takes into account `status` on `Case`.',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsUUID()
  status?: string

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
      'Department to filter cases on, takes into account `department` on `Advert`.',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsUUID()
  department?: string
}
