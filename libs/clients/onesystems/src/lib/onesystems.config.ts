import { createClient, createConfig } from '../gen/fetch/client'
import type { ClientOptions } from '../gen/fetch/types.gen'

/**
 * Jafnréttisstofa's OneExternalAPI instance. Used when `ONESYSTEMS_API_URL` is
 * not set.
 */
export const ONESYSTEMS_DEFAULT_BASE_URL =
  'https://jafnrettisstofa-one.onecrm.is/OneExternalAPI'

/** Per-request timeout, applied to every call including Login. */
export const ONESYSTEMS_REQUEST_TIMEOUT_MS = 30_000

/**
 * Resolves the base URL at request time, never at import, so an app that loads
 * its env after importing this package still picks up the override. A trailing
 * slash is stripped because the generated client concatenates the base URL and
 * the operation path directly.
 */
export function resolveOneSystemsBaseUrl(): string {
  const override = process.env.ONESYSTEMS_API_URL?.trim()
  return (override || ONESYSTEMS_DEFAULT_BASE_URL).replace(/\/+$/, '')
}

/**
 * Client for the four action endpoints. It carries no `auth` of its own: the
 * service passes the current bearer token on each request, so a refreshed
 * token is used immediately and nothing is captured at import time.
 */
export const oneSystemsActionClient = createClient(
  createConfig<ClientOptions>({ baseUrl: ONESYSTEMS_DEFAULT_BASE_URL }),
)

/**
 * Client used only for Login. It is kept separate from the action client and
 * never has `auth` configured, so Login can never be sent with (or wait on) a
 * bearer token.
 */
export const oneSystemsLoginClient = createClient(
  createConfig<ClientOptions>({ baseUrl: ONESYSTEMS_DEFAULT_BASE_URL }),
)
