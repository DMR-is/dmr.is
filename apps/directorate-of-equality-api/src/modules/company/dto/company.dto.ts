import {
  ApiBoolean,
  ApiEnum,
  ApiOptionalString,
  ApiOptionalUuid,
  ApiString,
  ApiUUId,
} from '@dmr.is/decorators'

import { CompanySizeEnum, CompanyStatusEnum } from '../models/company.enums'

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
}
