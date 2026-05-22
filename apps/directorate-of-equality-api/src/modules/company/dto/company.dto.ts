import { ApiBoolean, ApiEnum, ApiString, ApiUUId } from '@dmr.is/decorators'

import { CompanySizeEnum } from '../models/company.enums'

export class CompanyDto {
  @ApiUUId()
  id!: string

  @ApiString()
  name!: string

  @ApiEnum(CompanySizeEnum, { enumName: 'CompanySizeEnum' })
  employeeCountCategory!: CompanySizeEnum

  @ApiString()
  nationalId!: string

  @ApiBoolean()
  salaryReportRequired!: boolean

  @ApiBoolean()
  salaryReportRequiredOverride!: boolean
}
