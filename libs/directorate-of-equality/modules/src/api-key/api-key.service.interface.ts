import {
  ApiKeyDto,
  ApiKeyOriginEnum,
  ApiKeyScopeEnum,
  IssuedApiKeyDto,
} from '@dmr.is/doe-shared'

import { CompanyStatusEnum } from '../company/models/company.enums'

/**
 * The company a key is being minted for. Taken as the fields actually needed
 * rather than a whole `CompanyDto`, so both callers can satisfy it: the
 * island.is path already holds one from `CompanyResourceGuard`, the admin path
 * resolves it by id.
 *
 * `status` is here because `company_event.status` is NOT NULL — every event row
 * snapshots the company status at insert.
 */
export type ApiKeyCompany = {
  id: string
  nationalId: string
  status: CompanyStatusEnum
}

export type IssueApiKeyInput = {
  company: ApiKeyCompany
  createdVia: ApiKeyOriginEnum
  /** Issuing reviewer. Required on the ADMIN path, absent on the island.is one. */
  actorUserId?: string | null
  /** Kennitala of the person issuing. Required on the ISLAND_IS path. */
  actorNationalId?: string | null
  label?: string | null
  /** Defaults to the full set when omitted. */
  scopes?: ApiKeyScopeEnum[]
  expiresAt?: Date | null
}

export type RevokeApiKeyInput = {
  /** `doe_api_key.id`, as listed. Not the `keyId` from the credential. */
  id: string
  /**
   * Scopes the revoke to one company — a caller cannot revoke another's key.
   * Passed whole rather than as an id because the revocation event needs
   * `status` too, and both callers already hold the company.
   */
  company: ApiKeyCompany
  actorUserId?: string | null
  actorNationalId?: string | null
  reason?: string | null
}

export interface IApiKeyService {
  /**
   * Mints a key and returns it with the plaintext secret attached. That secret
   * exists only in this return value: what is persisted is an HMAC, so nothing
   * can recover it afterwards. Callers must not log the result.
   */
  issue(input: IssueApiKeyInput): Promise<IssuedApiKeyDto>

  /** Every key held by a company, newest first. Never includes secrets. */
  list(companyId: string): Promise<ApiKeyDto[]>

  /**
   * Marks a key revoked. Idempotent: revoking an already-revoked key leaves the
   * original revocation and its actor intact rather than overwriting the audit
   * trail with a second one.
   */
  revoke(input: RevokeApiKeyInput): Promise<ApiKeyDto>
}

export const IApiKeyService = Symbol('IApiKeyService')
