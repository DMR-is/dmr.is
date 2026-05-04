import { Transform } from 'class-transformer'
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator'

import { ApiOptionalEnum, ApiOptionalNumber, ApiOptionalString } from '@dmr.is/decorators'
import { PagingQuery } from '@dmr.is/shared-dto'

export enum CompanySortByEnum {
  NAME = 'name',
  EMPLOYEE_COUNT = 'employeeCount',
}

export enum CompanySortDirectionEnum {
  ASC = 'asc',
  DESC = 'desc',
}

export class GetCompaniesQueryDto extends PagingQuery {
  @ApiOptionalString({ description: 'Free-text search on company name or national ID.' })
  @IsOptional()
  @IsString()
  q?: string

  @ApiOptionalNumber({ description: 'Return only companies with averageEmployeeCountFromRsk >= this value.', minimum: 0 })
  @Transform(({ value }) => {
    if (value == null) return undefined
    const n = parseInt(value, 10)
    return Number.isNaN(n) ? undefined : n
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minEmployeeCount?: number

  @ApiOptionalEnum(CompanySortByEnum, { enumName: 'CompanySortByEnum' })
  @IsOptional()
  @IsEnum(CompanySortByEnum)
  sortBy?: CompanySortByEnum

  @ApiOptionalEnum(CompanySortDirectionEnum, { enumName: 'CompanySortDirectionEnum' })
  @IsOptional()
  @IsEnum(CompanySortDirectionEnum)
  direction?: CompanySortDirectionEnum
}
