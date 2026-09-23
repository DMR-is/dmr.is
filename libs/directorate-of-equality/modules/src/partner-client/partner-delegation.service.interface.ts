import { ApiKeyScopeEnum } from '@dmr.is/doe-shared'

import { CompanyStatusEnum } from '../company/models/company.enums'
import { CompanyPartnerDelegationDto } from './dto/company-partner-delegation.dto'
import { PartnerDelegationDto } from './dto/partner-delegation.dto'
import { PartnerDelegationModel } from './models/partner-delegation.model'

/**
 * The company granting or withdrawing — the fields actually needed, so the
 * caller can pass the `CompanyDto` it already holds. `status` is here because
 * every `company_event` row snapshots it.
 */
export type DelegatingCompany = {
  id: string
  nationalId: string
  status: CompanyStatusEnum
}

export type GrantPartnerDelegationInput = {
  company: DelegatingCompany
  partnerClientId: string
  scopes: ApiKeyScopeEnum[]
  /** The person granting it: `user.actor.nationalId` under procuration. */
  actorNationalId: string
}

export type RevokePartnerDelegationInput = {
  /** `doe_partner_delegation.id`, as listed. */
  id: string
  /** Scopes the revoke to one company — a caller cannot revoke another's. */
  company: DelegatingCompany
  actorNationalId?: string | null
  actorUserId?: string | null
}

export interface IPartnerDelegationService {
  /**
   * The live delegation from one company to one firm, or null.
   *
   * **The one lookup every answer to "may this firm act for this company"
   * goes through**: the partner API's guard, and the self-service web's
   * "connected" state. Two queries that agree today are how this codebase has
   * repeatedly ended up with a screen that says yes and a route that says no.
   *
   * Checks the delegation's own `revoked_at` only. The caller must already
   * have refused a revoked client — the partner API does, in
   * `ApiKeyVerifyService`, before this is reached — since a live delegation
   * under a revoked client is not live.
   */
  findLive(
    partnerClientId: string,
    companyNationalId: string,
  ): Promise<PartnerDelegationModel | null>

  /**
   * Every live delegation to one firm, newest first. Same precondition as
   * `findLive`: the caller has already refused a revoked client.
   */
  listLiveForClient(partnerClientId: string): Promise<PartnerDelegationDto[]>

  /** Every live delegation one company has granted, newest first. */
  listLiveForCompany(companyId: string): Promise<CompanyPartnerDelegationDto[]>

  /**
   * Allows a firm to act for a company. Refuses a revoked or unknown firm, a
   * scope the firm was not approved for, and a second live delegation to the
   * same firm — changing what is allowed is withdraw, then grant again, so the
   * record of each grant stays intact.
   */
  grant(
    input: GrantPartnerDelegationInput,
  ): Promise<CompanyPartnerDelegationDto>

  /** Withdraws a delegation. Takes effect on the firm's next request. Idempotent. */
  revoke(
    input: RevokePartnerDelegationInput,
  ): Promise<CompanyPartnerDelegationDto>
}

export const IPartnerDelegationService = Symbol('IPartnerDelegationService')
