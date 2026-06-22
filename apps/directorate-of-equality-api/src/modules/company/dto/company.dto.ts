import { ApiPropertyOptional } from '@nestjs/swagger'

import {
  ApiBoolean,
  ApiEnum,
  ApiOptionalDateTime,
  ApiOptionalString,
  ApiOptionalUuid,
  ApiString,
  ApiUUId,
} from '@dmr.is/decorators'

import { CompanySizeEnum, CompanyStatusEnum } from '../models/company.enums'
import { IsatCategoryDto } from './isat-category.dto'

export class CompanyDto {
  @ApiUUId()
  id!: string

  @ApiString()
  name!: string

  @ApiEnum(CompanySizeEnum, { enumName: 'CompanySizeEnum' })
  employeeCountCategory!: CompanySizeEnum

  @ApiString()
  nationalId!: string

  @ApiEnum(CompanyStatusEnum, { enumName: 'CompanyStatusEnum' })
  status!: CompanyStatusEnum

  @ApiOptionalString({ nullable: true })
  address!: string | null

  @ApiOptionalUuid({ nullable: true })
  postcodeId!: string | null

  @ApiBoolean()
  salaryReportRequired!: boolean

  @ApiBoolean()
  salaryReportRequiredOverride!: boolean

  @ApiOptionalDateTime({ nullable: true })
  nextEqualityReportDueAt!: Date | null

  @ApiOptionalDateTime({ nullable: true })
  nextSalaryReportDueAt!: Date | null

  @ApiOptionalString({
    nullable: true,
    description:
      'Normalized ÍSAT2008 leaf code (admin-owned statistics field), e.g. "01110".',
  })
  isatCategoryCode!: string | null

  @ApiPropertyOptional({ type: IsatCategoryDto, nullable: true })
  isatCategory!: IsatCategoryDto | null
}
