import { ApiKeyScopeEnum } from '@dmr.is/doe-shared'

/**
 * What a verified key establishes about the caller.
 *
 * Deliberately no secret and no hash: once verification has happened neither is
 * needed again, and a context that carries them invites logging them.
 */
export type ApiKeyContext = {
  /** `doe_api_key.id` — the row, for audit. */
  id: string
  /** The public half, safe to log. */
  keyId: string
  companyId: string
  companyNationalId: string
  scopes: ApiKeyScopeEnum[]
}
