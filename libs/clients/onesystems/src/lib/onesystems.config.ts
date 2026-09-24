import { createClient, createConfig } from '../gen/fetch/client'
import type { ClientOptions } from '../gen/fetch/types.gen'
import type { OneSystemsOperation } from './onesystems.errors'

/** Per-request timeout for Login and every action except SendDocToIslandIs. */
export const ONESYSTEMS_REQUEST_TIMEOUT_MS = 30_000

/**
 * Per-request timeout for SendDocToIslandIs. It is longer because One makes
 * its own round trip to island.is inside the call, and a timeout here leaves
 * the delivery's outcome unknown (a stranded UNCERTAIN row), so waiting is
 * cheaper than giving up.
 */
export const ONESYSTEMS_SEND_DOC_TIMEOUT_MS = 120_000

/** The timeout for one request of `operation`. */
export function oneSystemsTimeoutMs(operation: OneSystemsOperation): number {
  return operation === 'SendDocToIslandIs'
    ? ONESYSTEMS_SEND_DOC_TIMEOUT_MS
    : ONESYSTEMS_REQUEST_TIMEOUT_MS
}

/**
 * Resolves `ONESYSTEMS_API_URL` at request time, never at import, so an app
 * that loads its env after importing this package still picks it up. There is
 * deliberately no default: a missing URL means the client is not configured,
 * rather than silently reaching the production One instance. Returns `null`
 * when it is unset or blank.
 *
 * A trailing slash is stripped because the generated client concatenates the
 * base URL and the operation path directly.
 */
export function resolveOneSystemsBaseUrl(): string | null {
  const value = process.env.ONESYSTEMS_API_URL?.trim()
  return value ? value.replace(/\/+$/, '') : null
}

/**
 * Client for the four action endpoints. It carries no `auth` and no base URL
 * of its own: the service passes the current bearer token and the resolved
 * base URL on each request, so a refreshed token is used immediately and
 * nothing is captured at import time.
 */
export const oneSystemsActionClient =
  createClient(createConfig<ClientOptions>())

/**
 * What the action client hands back as `error` for a non-2xx response whose
 * body was empty or whitespace only. Compare by identity.
 *
 * The generated client reads an error body as text, JSON-parses it, and then
 * replaces a falsy result with `{}`. That loses the raw text in both
 * directions: an empty body ends up as `{}`, the same as a literal `{}` body,
 * and a JSON `""` or `"   "` body parses to an empty string, which looks like
 * no body at all even though only an action handler can produce it. So
 * emptiness is decided from the raw bytes instead: the response interceptor
 * below reads a copy of every non-2xx body before the client parses it, and
 * the error interceptor swaps in this marker only for a response it recorded
 * as empty. The definitive-failure rule for CreateDocument and
 * SendDocToIslandIs, and the 401 retry, depend on it.
 */
export const ONESYSTEMS_EMPTY_ERROR_BODY: Readonly<Record<string, never>> =
  Object.freeze({})

/** Non-2xx responses whose raw body was empty or whitespace only. */
const emptyErrorBodyResponses = new WeakSet<Response>()

oneSystemsActionClient.interceptors.response.use(async (response) => {
  if (!response.ok) {
    try {
      if ((await response.clone().text()).trim() === '') {
        emptyErrorBodyResponses.add(response)
      }
    } catch {
      // The body could not be read. The client's own read of it fails the
      // same way and reports that, so the response is left unmarked.
    }
  }
  return response
})

oneSystemsActionClient.interceptors.error.use((error, response) =>
  response !== undefined && emptyErrorBodyResponses.has(response)
    ? ONESYSTEMS_EMPTY_ERROR_BODY
    : error,
)

/**
 * Client used only for Login. It is kept separate from the action client and
 * never has `auth` configured, so Login can never be sent with (or wait on) a
 * bearer token.
 */
export const oneSystemsLoginClient = createClient(createConfig<ClientOptions>())
