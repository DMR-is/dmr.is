import {
  ApiNumber,
  ApiOptionalUuid,
  ApiString,
  ApiUUId,
} from '@dmr.is/decorators'

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

  @ApiNumber()
  averageEmployeeCountFromRsk!: number

  @ApiString()
  isatCategory!: string
}
