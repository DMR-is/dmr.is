import { ApiKeyOriginEnum, ApiKeyScopeEnum } from '@dmr.is/doe-shared'

import { PartnerClientDto } from './dto/partner-client.dto'
import {
  IssuedPartnerClientKeyDto,
  PartnerClientKeyDto,
} from './dto/partner-client-key.dto'

export type CreatePartnerClientInput = {
  nationalId: string
  name: string
  /** Defaults to the standard set, without `scoring:write`, when omitted. */
  scopes?: ApiKeyScopeEnum[]
  /** The approving admin. A firm is never created by anyone else. */
  actorUserId: string
}

export type RevokePartnerClientInput = {
  id: string
  actorUserId: string
  reason?: string | null
}

export type IssuePartnerClientKeyInput = {
  partnerClientId: string
  createdVia: ApiKeyOriginEnum
  /** Issuing reviewer. Required on the ADMIN path. */
  actorUserId?: string | null
  /** Kennitala of the person issuing. Required on the ISLAND_IS path. */
  actorNationalId?: string | null
  label?: string | null
  expiresAt?: Date | null
}

export type RevokePartnerClientKeyInput = {
  /** `doe_partner_client_key.id`, as listed. Not the `keyId`. */
  id: string
  /** Scopes the revoke to one firm — a caller cannot revoke another's key. */
  partnerClientId: string
  actorUserId?: string | null
  actorNationalId?: string | null
  reason?: string | null
}

export interface IPartnerClientService {
  /**
   * Approves a firm. Refuses a second live client for the same kennitala: a
   * firm is one client, and its credentials are rotated as keys under it.
   */
  create(input: CreatePartnerClientInput): Promise<PartnerClientDto>

  /** Every firm ever approved, newest first, revoked ones included. */
  list(): Promise<PartnerClientDto[]>

  get(id: string): Promise<PartnerClientDto>

  /**
   * Cuts a firm off. Its keys and delegations are left as they are — the
   * partner API refuses a revoked client whatever it still holds — so their
   * own audit trail is not rewritten by a revocation that was not about them.
   * Idempotent.
   */
  revoke(input: RevokePartnerClientInput): Promise<PartnerClientDto>

  /**
   * Mints a `doev_…` key and returns it with the plaintext secret attached.
   * That secret exists only in this return value. Callers must not log it.
   */
  issueKey(
    input: IssuePartnerClientKeyInput,
  ): Promise<IssuedPartnerClientKeyDto>

  /** Every key a firm holds, newest first. Never includes secrets. */
  listKeys(partnerClientId: string): Promise<PartnerClientKeyDto[]>

  /** Marks one key revoked. Idempotent. The firm keeps its other keys. */
  revokeKey(input: RevokePartnerClientKeyInput): Promise<PartnerClientKeyDto>
}

export const IPartnerClientService = Symbol('IPartnerClientService')
