import { ApiString } from '@dmr.is/decorators'

export class CompanyLookupDto {
  @ApiString()
  name!: string

  @ApiString()
  nationalId!: string
}
