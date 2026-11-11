import { SetMetadata } from '@nestjs/common'

export const SELF_SERVICE_TOKEN_SURFACE_METADATA = 'doeSelfServiceTokenSurface'

/**
 * Narrows `CompanyResourceGuard`'s token check from `COMPANY_TOKEN_SCOPES` to
 * `SELF_SERVICE_TOKEN_SCOPES`, for routes where a company manages its own API
 * keys and partner delegations. See `SELF_SERVICE_TOKEN_SCOPES` for why.
 *
 * Applied to the controller, so a new handler on it is covered without anyone
 * remembering to. `swagger-coverage.spec.ts` pins which routes carry it.
 */
export const SelfServiceTokenSurface = () =>
  SetMetadata(SELF_SERVICE_TOKEN_SURFACE_METADATA, true)
