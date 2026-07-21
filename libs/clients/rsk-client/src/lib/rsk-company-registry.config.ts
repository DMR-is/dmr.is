import type { Config } from '../gen/fetch/client'
import { client } from '../gen/fetch/client.gen'

/** Base URL from the OpenAPI `servers` entry — used when no env override is set. */
const DEFAULT_BASE_URL = 'https://api.skattur.cloud/legalentities/v2.1'

/**
 * Configures the generated RSK company-registry client.
 *
 * Reads configuration from the environment by default:
 * - `RSK_COMPANY_REGISTRY_API_PATH` — base URL (falls back to the spec's server)
 * - `RSK_PRIMARY_KEY` / `RSK_SECONDARY_KEY` — the two interchangeable APIM
 *   subscription keys. The primary is used, falling back to the secondary, and
 *   is sent as the `Ocp-Apim-Subscription-Key` header. Resolved lazily per request.
 *
 * Called once on import so the client works out of the box; pass `override` to
 * supply values explicitly (e.g. from a NestJS ConfigService).
 */
export function configureRskCompanyRegistryClient(
  override: Partial<Config> = {},
): void {
  client.setConfig({
    baseUrl: process.env.RSK_COMPANY_REGISTRY_API_PATH || DEFAULT_BASE_URL,
    // Resolved per request; the client places it in the Ocp-Apim-Subscription-Key header.
    auth: () => process.env.RSK_PRIMARY_KEY || process.env.RSK_SECONDARY_KEY,
    ...override,
  })
}

// Import-time side effect: apply the env-based defaults as soon as this module
// is loaded, so consumers that just call the generated SDK (or inject the
// service) get a working, authenticated client without any explicit setup.
//
// This is safe because:
//   - the base URL falls back to the spec's server, so it is never empty; and
//   - `auth` is a callback, so the subscription key is read from the environment
//     lazily on each request — not captured here at import time. An app can load
//     its `.env` after this import and the key will still be picked up.
//
// Call `configureRskCompanyRegistryClient(override)` again at bootstrap to
// supply values explicitly (e.g. from a NestJS ConfigService).
configureRskCompanyRegistryClient()

export { client as rskCompanyRegistryClient }
