import { ApiString, ApiUUId } from '@dmr.is/decorators'

export class PostcodeDto {
  @ApiUUId()
  id!: string

  @ApiString({ description: 'Three-digit Icelandic postcode, e.g. 101' })
  code!: string

  @ApiString({ description: 'Locality / place name, e.g. Reykjavík' })
  place!: string

  @ApiUUId()
  regionId!: string
}
