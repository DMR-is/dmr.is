import { ApiString, ApiUUId } from '@dmr.is/decorators'

export class RegionDto {
  @ApiUUId()
  id!: string

  @ApiString({ description: 'Stable machine key for the region, e.g. CAPITAL' })
  code!: string

  @ApiString({ description: 'Display name (Icelandic), e.g. Höfuðborgarsvæðið' })
  name!: string
}
