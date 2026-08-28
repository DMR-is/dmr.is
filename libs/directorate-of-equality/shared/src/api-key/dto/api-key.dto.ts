import {
  ApiArray,
  ApiDateTime,
  ApiEnum,
  ApiOptionalDateTime,
  ApiOptionalString,
  ApiString,
  ApiUUId,
} from '@dmr.is/decorators'

import { ApiKeyOriginEnum, ApiKeyScopeEnum } from '../api-key.constants'

/**
 * A key as it can be shown after issuance.
 *
 * There is deliberately no secret on this DTO, and no endpoint that can produce
 * one: only the HMAC is stored, so the plaintext is unrecoverable the moment the
 * issuing response is discarded. `keyId` is the public half — enough to tell two
 * keys apart in a list and to match a key against an audit entry, useless as a
 * credential on its own.
 */
export class ApiKeyDto {
  @ApiUUId()
  id!: string

  @ApiUUId()
  companyId!: string

  @ApiString({
    description:
      'Public half of the key, as it appears in the issued credential. Not a secret.',
  })
  keyId!: string

  @ApiOptionalString({
    nullable: true,
    description: 'Free-text label set by whoever issued the key.',
  })
  label!: string | null

  @ApiArray({
    type: String,
    enum: ApiKeyScopeEnum,
    isArray: true,
    description: 'What this key is permitted to do.',
  })
  scopes!: ApiKeyScopeEnum[]

  @ApiEnum(ApiKeyOriginEnum, {
    enumName: 'ApiKeyOriginEnum',
    description:
      'Which issuance path minted the key — self-service through island.is, or a DoE reviewer.',
  })
  createdVia!: ApiKeyOriginEnum

  @ApiOptionalString({
    nullable: true,
    description:
      'Kennitala of the person who minted the key on the island.is path. Null on the admin path, where `createdByUserId` names the reviewer instead.',
  })
  createdByNationalId!: string | null

  @ApiOptionalString({
    nullable: true,
    description: 'DoE reviewer who minted the key. Null on the island.is path.',
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
      'Last time the key authenticated a request. Written at most once a minute per key, so it is an activity indicator rather than an exact timestamp.',
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
 * The issuance response — the only place the plaintext key is ever produced.
 *
 * Kept as a separate class from `ApiKeyDto` rather than an optional field on it,
 * so that no read path can accidentally serialise a `key`: a handler either
 * returns the type that has the secret or the type that cannot.
 */
export class IssuedApiKeyDto {
  @ApiString({
    description:
      'The full plaintext key. Shown exactly once — it cannot be retrieved again, only replaced.',
  })
  key!: string

  @ApiUUId()
  id!: string

  @ApiString()
  keyId!: string

  @ApiOptionalString({ nullable: true })
  label!: string | null

  @ApiArray({
    type: String,
    enum: ApiKeyScopeEnum,
    isArray: true,
  })
  scopes!: ApiKeyScopeEnum[]

  @ApiDateTime()
  createdAt!: Date

  @ApiOptionalDateTime({ nullable: true })
  expiresAt!: Date | null
}
