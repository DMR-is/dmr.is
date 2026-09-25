import { ApiDtoArray } from '@dmr.is/decorators'

import { PartnerProviderDto } from './partner-provider.dto'

/** Every approved provider a company may choose from. Active ones only. */
export class GetPartnerProvidersResponseDto {
  @ApiDtoArray(PartnerProviderDto)
  providers!: PartnerProviderDto[]
}
