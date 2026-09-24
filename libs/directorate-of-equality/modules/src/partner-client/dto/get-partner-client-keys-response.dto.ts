import { ApiDtoArray } from '@dmr.is/decorators'

import { PartnerClientKeyDto } from './partner-client-key.dto'

/**
 * The keys a firm holds — revoked and expired ones included, so the list
 * doubles as the audit view.
 */
export class GetPartnerClientKeysResponseDto {
  @ApiDtoArray(PartnerClientKeyDto)
  keys!: PartnerClientKeyDto[]
}
