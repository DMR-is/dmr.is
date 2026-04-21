import { ApiBoolean, ApiNumber, ApiString, ApiUUId } from '@dmr.is/decorators'

export class CompanyDto {
  @ApiUUId()
  id!: string

  @ApiString()
  name!: string

  @ApiString()
  address!: string

  @ApiString()
  city!: string

  @ApiString()
  postcode!: string

  @ApiNumber()
  averageEmployeeCountFromRsk!: number

  @ApiString()
  nationalId!: string

  @ApiString()
  isatCategory!: string

  @ApiBoolean()
  salaryReportRequired!: boolean

  @ApiBoolean()
  salaryReportRequiredOverride!: boolean
}
