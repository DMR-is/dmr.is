import {
  ApiArray,
  ApiDateTime,
  ApiDto,
  ApiOptionalString,
  ApiString,
  ApiUUId,
} from '@dmr.is/decorators'
import { ApiKeyScopeEnum } from '@dmr.is/doe-shared'

import { PartnerProviderDto } from './partner-provider.dto'

/** A delegation as the company that granted it sees it. */
export class CompanyPartnerDelegationDto {
  @ApiUUId()
  id!: string

  @ApiDto(PartnerProviderDto)
  provider!: PartnerProviderDto

  @ApiArray({
    type: String,
    enum: ApiKeyScopeEnum,
    isArray: true,
    description: 'What the company allowed this provider to do.',
  })
  scopes!: ApiKeyScopeEnum[]

  @ApiDateTime()
  grantedAt!: Date

  @ApiString({ description: 'Kennitala of the person who granted it.' })
  grantedByNationalId!: string

  @ApiOptionalString({
    nullable: true,
    description:
      'Name of the person who granted it, as island.is gave it at the time — show this instead of `grantedByNationalId`. Null for delegations granted before names were recorded; show a fallback then.',
  })
  grantedByName!: string | null
}
