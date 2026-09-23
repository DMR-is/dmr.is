import { ApiKeyKindEnum, ApiKeyScopeEnum } from '@dmr.is/doe-shared'

type VerifiedKey = {
  /** The key row's id, for audit. */
  id: string
  /** The public half, safe to log. */
  keyId: string
  /**
   * What the caller may do. For a company key, the key's own scopes. For a
   * vendor client key, the firm's scopes until `PartnerCompanyGuard` narrows
   * them to the intersection with the delegation it resolves.
   */
  scopes: ApiKeyScopeEnum[]
}

/** A `doe_…` key: the tenant is the company the key belongs to. */
export type CompanyKeyContext = VerifiedKey & {
  kind: ApiKeyKindEnum.COMPANY
  companyId: string
  companyNationalId: string
}

/**
 * A `doev_…` key: the caller is a firm, and which company it acts for is not
 * known until `PartnerCompanyGuard` reads `X-Company-National-Id` and finds a
 * delegation.
 */
export type PartnerClientKeyContext = VerifiedKey & {
  kind: ApiKeyKindEnum.PARTNER_CLIENT
  partnerClientId: string
}

/**
 * What a verified key establishes about the caller.
 *
 * Deliberately no secret and no hash: once verification has happened neither is
 * needed again, and a context that carries them invites logging them.
 */
export type ApiKeyContext = CompanyKeyContext | PartnerClientKeyContext
