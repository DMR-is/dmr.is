import { ApiBoolean, ApiNumber, ApiString, ApiUUId } from '@dmr.is/decorators'

export class CompanyDto {
  @ApiUUId()
  id!: string

  @ApiString()
  name!: string

  @ApiNumber()
  averageEmployeeCountFromRsk!: number

  @ApiString()
  nationalId!: string

  @ApiBoolean()
  salaryReportRequired!: boolean

  @ApiBoolean()
  salaryReportRequiredOverride!: boolean
}
