import {
  ApiDateTime,
  ApiEnum,
  ApiOptionalDateTime,
  ApiOptionalString,
  ApiString,
  ApiUUId,
} from '@dmr.is/decorators'
import { ApiKeyOriginEnum } from '@dmr.is/doe-shared'

/**
 * A vendor client key as it can be shown after issuance. The twin of
 * `ApiKeyDto`, and like it carries no secret: only the HMAC is stored.
 */
export class PartnerClientKeyDto {
  @ApiUUId()
  id!: string

  @ApiUUId()
  partnerClientId!: string

  @ApiString({
    description:
      'Public half of the key, as it appears in the issued credential. Not a secret.',
  })
  keyId!: string

  @ApiOptionalString({ nullable: true })
  label!: string | null

  @ApiEnum(ApiKeyOriginEnum, {
    enumName: 'ApiKeyOriginEnum',
    description:
      'Which issuance path minted the key — the firm itself on the self-service web, or a DoE reviewer.',
  })
  createdVia!: ApiKeyOriginEnum

  @ApiOptionalString({
    nullable: true,
    description:
      'Kennitala of the person who minted the key on the self-service path. Null on the admin path.',
  })
  createdByNationalId!: string | null

  @ApiOptionalString({
    nullable: true,
    description:
      'DoE reviewer who minted the key. Null on the self-service path.',
  })
  createdByUserId!: string | null

  @ApiDateTime()
  createdAt!: Date

  @ApiOptionalDateTime({
    nullable: true,
    description: 'When the key stops being accepted. Null means no expiry.',
  })
  expiresAt!: Date | null

  @ApiOptionalDateTime({
    nullable: true,
    description:
      'Last time the key authenticated a request. Written at most once a minute per key.',
  })
  lastUsedAt!: Date | null

  @ApiOptionalDateTime({ nullable: true })
  revokedAt!: Date | null

  @ApiOptionalString({ nullable: true })
  revokedByNationalId!: string | null

  @ApiOptionalString({ nullable: true })
  revokedByUserId!: string | null

  @ApiOptionalString({ nullable: true })
  revokedReason!: string | null
}

/**
 * The issuance response — the only place a vendor client's plaintext key is
 * ever produced. A separate class so no read path can serialise a `key`.
 */
export class IssuedPartnerClientKeyDto {
  @ApiString({
    description:
      'The full plaintext key, `doev_<env>_<keyId>.<secret>`. Shown exactly once — it cannot be retrieved again, only replaced.',
  })
  key!: string

  @ApiUUId()
  id!: string

  @ApiUUId()
  partnerClientId!: string

  @ApiString()
  keyId!: string

  @ApiOptionalString({ nullable: true })
  label!: string | null

  @ApiDateTime()
  createdAt!: Date

  @ApiOptionalDateTime({ nullable: true })
  expiresAt!: Date | null
}
