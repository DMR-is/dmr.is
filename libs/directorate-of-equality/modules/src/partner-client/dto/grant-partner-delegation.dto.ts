import { ArrayMinSize, ArrayUnique, IsEnum } from 'class-validator'

import { ApiArray, ApiUUId } from '@dmr.is/decorators'
import { ApiKeyScopeEnum } from '@dmr.is/doe-shared'

/**
 * Allowing a provider to act for the signed-in company. Deliberately no company
 * field: the company comes from the sign-in, never from the body.
 */
export class GrantPartnerDelegationDto {
  @ApiUUId({ description: 'The provider’s `id`, as listed.' })
  partnerClientId!: string

  @ApiArray({
    type: String,
    enum: ApiKeyScopeEnum,
    isArray: true,
    description:
      'What to allow, named explicitly — there is no default. Must be within what the provider was approved for. `scoring:write` lets the provider author and delete this company’s starfsmat.',
  })
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsEnum(ApiKeyScopeEnum, { each: true })
  scopes!: ApiKeyScopeEnum[]
}
