import { Transform } from 'class-transformer'
import { IsArray, IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

import {
  ApiOptionalArray,
  ApiOptionalBoolean,
  ApiOptionalEnum,
  ApiOptionalString,
} from '@dmr.is/decorators'
import { PagingQuery } from '@dmr.is/shared-dto'

import {
  CompanyReportStatusEnum,
  CompanySizeEnum,
} from '../models/company.enums'
import { CompanyExpiryFilterEnum } from '../utils/filters'

export { CompanyExpiryFilterEnum }

export enum CompanySortByEnum {
  NAME = 'name',
  EMPLOYEE_COUNT = 'employeeCount',
  NEXT_REPORT_DUE = 'nextReportDue',
}

export enum CompanySortDirectionEnum {
  ASC = 'asc',
  DESC = 'desc',
}

export class GetCompaniesQueryDto extends PagingQuery {
  @ApiOptionalString({
    description: 'Free-text search on company name or national ID.',
  })
  @IsOptional()
  @IsString()
  q?: string

  @ApiOptionalEnum(CompanySizeEnum, {
    enumName: 'CompanySizeEnum',
    description: 'Return only companies whose employee-count bucket matches.',
  })
  @IsOptional()
  @IsEnum(CompanySizeEnum)
  employeeCountCategory?: CompanySizeEnum

  @ApiProperty({
    enum: CompanyReportStatusEnum,
    enumName: 'CompanyReportStatusEnum',
    isArray: true,
    required: false,
    description:
      'Return only companies whose report status is one of the provided values (same status shown on each company). Omit for no constraint.',
  })
  @Transform(({ value }) => {
    if (value == null) return undefined
    return Array.isArray(value) ? value : [value]
  })
  @IsOptional()
  @IsArray()
  @IsEnum(CompanyReportStatusEnum, { each: true })
  companyStatus?: CompanyReportStatusEnum[]

  @ApiProperty({
    enum: CompanyExpiryFilterEnum,
    enumName: 'CompanyExpiryFilterEnum',
    isArray: true,
    required: false,
    description:
      'Return only companies that have an approved report expiring within the given window. Multiple values are OR-ed; the largest window wins.',
  })
  @Transform(({ value }) => {
    if (value == null) return undefined
    return Array.isArray(value) ? value : [value]
  })
  @IsOptional()
  @IsArray()
  @IsEnum(CompanyExpiryFilterEnum, { each: true })
  expiresWithin?: CompanyExpiryFilterEnum[]

  @ApiOptionalBoolean({
    description:
      'When true, return only companies in the daily-fines process (finesStarted = true).',
  })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsOptional()
  @IsBoolean()
  finesStarted?: boolean

  @ApiOptionalBoolean({
    description:
      'When true, return only quarantined companies (quarantined = true).',
  })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsOptional()
  @IsBoolean()
  quarantined?: boolean

  @ApiOptionalBoolean({
    description:
      'When true, return only companies whose next equality or salary report due date has passed.',
  })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsOptional()
  @IsBoolean()
  overdue?: boolean

  @ApiOptionalArray({
    type: String,
    isArray: true,
    description:
      'Return only companies whose admin-owned ÍSAT2008 category is one of the given leaf codes (e.g. "01110").',
  })
  @Transform(({ value }) => {
    if (value == null) return undefined
    return Array.isArray(value) ? value : [value]
  })
  @IsString({ each: true })
  isatCategoryCode?: string[]

  @ApiOptionalArray({
    type: String,
    isArray: true,
    description:
      'Return only companies located in one of the given regions (landshluti), by region code (e.g. "CAPITAL"). Resolved via the company postcode.',
  })
  @Transform(({ value }) => {
    if (value == null) return undefined
    return Array.isArray(value) ? value : [value]
  })
  @IsString({ each: true })
  regionCode?: string[]

  @ApiOptionalArray({
    type: String,
    isArray: true,
    description:
      'Return only companies with one of the given postcodes (póstnúmer, e.g. "101").',
  })
  @Transform(({ value }) => {
    if (value == null) return undefined
    return Array.isArray(value) ? value : [value]
  })
  @IsString({ each: true })
  postcode?: string[]

  @ApiOptionalEnum(CompanySortByEnum, { enumName: 'CompanySortByEnum' })
  @IsOptional()
  @IsEnum(CompanySortByEnum)
  sortBy?: CompanySortByEnum

  @ApiOptionalEnum(CompanySortDirectionEnum, {
    enumName: 'CompanySortDirectionEnum',
  })
  @IsOptional()
  @IsEnum(CompanySortDirectionEnum)
  direction?: CompanySortDirectionEnum
}
