import { ArrayMinSize, ArrayUnique, IsEnum } from 'class-validator'

import { ApiOptionalArray, ApiUUId } from '@dmr.is/decorators'
import { ApiKeyScopeEnum } from '@dmr.is/doe-shared'

/**
 * Allowing a provider to act for the signed-in company. Deliberately no company
 * field: the company comes from the sign-in, never from the body.
 */
export class GrantPartnerDelegationDto {
  @ApiUUId({ description: 'The provider’s `id`, as listed.' })
  partnerClientId!: string

  @ApiOptionalArray({
    type: String,
    enum: ApiKeyScopeEnum,
    isArray: true,
    description:
      'Omit to hand the provider everything it was approved for — the self-service web always does: a delegation is all or nothing. Named, it must be within that approval. `scoring:write` lets the provider author and delete this company’s starfsmat.',
  })
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsEnum(ApiKeyScopeEnum, { each: true })
  scopes?: ApiKeyScopeEnum[]
}
