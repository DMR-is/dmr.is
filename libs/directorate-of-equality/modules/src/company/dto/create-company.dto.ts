import { ApiEnum, ApiString } from '@dmr.is/decorators'

import { CompanySizeEnum } from '../models/company.enums'

export class CreateCompanyDto {
  @ApiString()
  nationalId!: string

  @ApiString()
  name!: string

  @ApiEnum(CompanySizeEnum, { enumName: 'CompanySizeEnum' })
  employeeCountCategory!: CompanySizeEnum
}
