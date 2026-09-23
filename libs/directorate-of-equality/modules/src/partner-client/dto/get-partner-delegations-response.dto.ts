import { ApiDtoArray } from '@dmr.is/decorators'

import { PartnerDelegationDto } from './partner-delegation.dto'

/** The companies currently delegating to the calling firm. */
export class GetPartnerDelegationsResponseDto {
  @ApiDtoArray(PartnerDelegationDto)
  delegations!: PartnerDelegationDto[]
}
