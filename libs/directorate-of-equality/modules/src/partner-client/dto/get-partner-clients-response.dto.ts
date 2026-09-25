import { ApiDtoArray } from '@dmr.is/decorators'

import { PartnerClientDto } from './partner-client.dto'

/** Every firm ever approved, revoked ones included. Small, unpaginated set. */
export class GetPartnerClientsResponseDto {
  @ApiDtoArray(PartnerClientDto)
  partnerClients!: PartnerClientDto[]
}
