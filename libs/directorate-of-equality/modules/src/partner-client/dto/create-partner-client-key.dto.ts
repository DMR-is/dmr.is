import { ApiOptionalDateTime, ApiOptionalString } from '@dmr.is/decorators'

/**
 * What a caller may choose about a new vendor client key. No scopes: a key is
 * the client, and the client's scopes are the ones that count.
 */
export class CreatePartnerClientKeyDto {
  @ApiOptionalString({
    nullable: true,
    description:
      'Free-text label to tell this key apart from the others, e.g. the environment it is deployed to.',
  })
  label?: string | null

  @ApiOptionalDateTime({
    nullable: true,
    description: 'When the key stops being accepted. Omit for no expiry.',
  })
  expiresAt?: Date | null
}
