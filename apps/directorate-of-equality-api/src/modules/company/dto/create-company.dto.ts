import { ApiNumber, ApiString } from '@dmr.is/decorators'

export class CreateCompanyDto {
  @ApiString()
  nationalId!: string

  @ApiString()
  name!: string

  @ApiNumber()
  averageEmployeeCountFromRsk!: number
}
