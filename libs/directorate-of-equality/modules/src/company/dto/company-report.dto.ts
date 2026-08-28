import {
  ApiEnum,
  ApiOptionalUuid,
  ApiString,
  ApiUUId,
} from '@dmr.is/decorators'

import { CompanySizeEnum } from '../models/company.enums'

export class CompanyReportDto {
  @ApiUUId()
  id!: string

  @ApiUUId()
  companyId!: string

  @ApiUUId()
  reportId!: string

  @ApiOptionalUuid({ nullable: true })
  parentCompanyId!: string | null

  @ApiString()
  name!: string

  @ApiString()
  nationalId!: string

  @ApiString()
  address!: string

  @ApiString()
  city!: string

  @ApiString()
  postcode!: string

  @ApiEnum(CompanySizeEnum, { enumName: 'CompanySizeEnum' })
  employeeCountCategory!: CompanySizeEnum

  @ApiString()
  isatCategory!: string
}
