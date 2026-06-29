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

import {
  CompanyReportStatusEnum,
  CompanySizeEnum,
  CompanyStatusEnum,
} from '../models/company.enums'
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

  @ApiOptionalString({
    nullable: true,
    description: 'Contact email for the company. Used by the deadline-reminder task.',
  })
  email!: string | null

  @ApiOptionalString({ nullable: true })
  address!: string | null

  @ApiOptionalUuid({ nullable: true })
  postcodeId!: string | null

  @ApiBoolean()
  salaryReportRequired!: boolean

  @ApiBoolean()
  salaryReportRequiredOverride!: boolean

  @ApiBoolean({
    description:
      'Daily-fines flag. `true` means the company is in the daily-fines process, handled outside this system.',
  })
  finesStarted!: boolean

  @ApiBoolean({
    description:
      'Admin halt switch. `true` means all outbound activity (scheduled jobs, emails, notifications) for the company is suspended.',
  })
  quarantined!: boolean

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

  @ApiEnum(CompanyReportStatusEnum, { enumName: 'CompanyReportStatusEnum' })
  reportStatus!: CompanyReportStatusEnum

  @ApiBoolean({
    description:
      'Derived: the company\'s next equality-report due date has passed.',
  })
  equalityReportOverdue!: boolean

  @ApiBoolean({
    description:
      'Derived: the company\'s next salary-report due date has passed.',
  })
  salaryReportOverdue!: boolean
}
