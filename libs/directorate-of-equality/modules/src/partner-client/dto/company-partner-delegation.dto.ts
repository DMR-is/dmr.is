import {
  ApiArray,
  ApiDateTime,
  ApiDto,
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
}
