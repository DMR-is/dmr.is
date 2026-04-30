import { ApiString } from '@dmr.is/decorators'

export class SubmitReportCompanyDto {
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

  @ApiString()
  isatCategory!: string
}

export class SubmitReportSubsidiaryDto {
  @ApiString()
  name!: string

  @ApiString()
  nationalId!: string
}
