import { ApiString, ApiUUId } from '@dmr.is/decorators'

/**
 * An approved provider as a company sees it when choosing whom to allow. The
 * kennitala is shown beside the name so two similarly named firms are not a
 * coin flip.
 */
export class PartnerProviderDto {
  @ApiUUId()
  id!: string

  @ApiString()
  name!: string

  @ApiString({ description: 'The firm’s kennitala.' })
  nationalId!: string
}
