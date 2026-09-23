import { ApiArray, ApiDateTime, ApiString, ApiUUId } from '@dmr.is/decorators'
import { ApiKeyScopeEnum } from '@dmr.is/doe-shared'

/**
 * A company that has allowed a firm to act for it, as the firm sees it on
 * `GET /partner/delegations`.
 *
 * Deliberately narrow: who granted it (a person's kennitala) is the company's
 * business and Jafnréttisstofa's, not the firm's.
 */
export class PartnerDelegationDto {
  @ApiUUId()
  id!: string

  @ApiString({
    description:
      'The kennitala of the company that granted it. Send this as `X-Company-National-Id` to act for them.',
  })
  companyNationalId!: string

  @ApiString({ description: 'The company’s name in the register.' })
  companyName!: string

  @ApiArray({
    type: String,
    enum: ApiKeyScopeEnum,
    isArray: true,
    description:
      'What this company allowed. What you may actually do for it is this intersected with your own scopes.',
  })
  scopes!: ApiKeyScopeEnum[]

  @ApiDateTime({ description: 'When the company granted it.' })
  grantedAt!: Date
}
