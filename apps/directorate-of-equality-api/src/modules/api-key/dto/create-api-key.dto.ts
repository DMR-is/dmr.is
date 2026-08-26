import { ApiOptionalArray, ApiOptionalDateTime, ApiOptionalString } from '@dmr.is/decorators'
import { ApiKeyScopeEnum } from '@dmr.is/doe-shared'

/**
 * Everything about a new key that a caller may choose. Notably absent: the
 * company. That comes from the authenticated context, never the body — a caller
 * cannot mint a credential for someone else.
 */
export class CreateApiKeyDto {
  @ApiOptionalString({
    nullable: true,
    description:
      'Free-text label to tell this key apart from the others in a list, e.g. the name of the payroll system it was issued for.',
  })
  label?: string | null

  @ApiOptionalArray({
    type: String,
    enum: ApiKeyScopeEnum,
    isArray: true,
    description:
      'Narrows what the key may do. Omit to grant the full set. An unrecognised scope is rejected rather than stored.',
  })
  scopes?: ApiKeyScopeEnum[]

  @ApiOptionalDateTime({
    nullable: true,
    description: 'When the key stops being accepted. Omit for no expiry.',
  })
  expiresAt?: Date | null
}
