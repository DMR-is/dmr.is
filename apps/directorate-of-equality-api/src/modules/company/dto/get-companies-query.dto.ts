import { Transform } from 'class-transformer'
import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

import { ApiOptionalEnum, ApiOptionalString } from '@dmr.is/decorators'
import { PagingQuery } from '@dmr.is/shared-dto'

import { CompanySizeEnum } from '../models/company.enums'
import { CompanyExpiryFilterEnum, CompanyStatusFilterEnum } from '../utils/filters'

export { CompanyExpiryFilterEnum, CompanyStatusFilterEnum }

export enum CompanySortByEnum {
  NAME = 'name',
  EMPLOYEE_COUNT = 'employeeCount',
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
    enum: CompanyStatusFilterEnum,
    enumName: 'CompanyStatusFilterEnum',
    isArray: true,
    required: false,
    description:
      'Return only companies that match at least one of the provided status values. Omit for no constraint.',
  })
  @Transform(({ value }) => {
    if (value == null) return undefined
    return Array.isArray(value) ? value : [value]
  })
  @IsOptional()
  @IsArray()
  @IsEnum(CompanyStatusFilterEnum, { each: true })
  companyStatus?: CompanyStatusFilterEnum[]

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
