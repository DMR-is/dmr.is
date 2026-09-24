import { createClient, createConfig } from '../gen/fetch/client'
import type { ClientOptions } from '../gen/fetch/types.gen'
import type { OneSystemsOperation } from './onesystems.errors'

/** Per-request timeout for Login, CreateCase and CloseCase. */
export const ONESYSTEMS_REQUEST_TIMEOUT_MS = 30_000

/**
 * Per-request timeout for CreateDocument and SendDocToIslandIs, the two calls
 * that must never repeat. A timeout on either leaves the delivery's outcome
 * unknown (a stranded UNCERTAIN row), so waiting is cheaper than giving up.
 * CreateDocument uploads the PDF base64-encoded and One files it; inside
 * SendDocToIslandIs One makes its own round trip to island.is.
 */
export const ONESYSTEMS_DOCUMENT_TIMEOUT_MS = 120_000

/** The timeout for one request of `operation`. */
export function oneSystemsTimeoutMs(operation: OneSystemsOperation): number {
  return operation === 'CreateDocument' || operation === 'SendDocToIslandIs'
    ? ONESYSTEMS_DOCUMENT_TIMEOUT_MS
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
 * {@link ONESYSTEMS_EMPTY_BEARER_CHALLENGE_BODY} is the same for an empty 401
 * that also carried a `WWW-Authenticate: Bearer ...` challenge.
 *
 * The generated client reads an error body as text, JSON-parses it, and then
 * replaces a falsy result with `{}`. That loses the raw text in both
 * directions: an empty body ends up as `{}`, the same as a literal `{}` body,
 * and a JSON `""` or `"   "` body parses to an empty string, which looks like
 * no body at all even though only an action handler can produce it. So
 * emptiness is decided from the raw bytes instead: the response interceptor
 * below reads a copy of every non-2xx body before the client parses it, and
 * the error interceptor swaps in a marker only for a response it recorded as
 * empty.
 *
 * An empty body alone does not prove the action never ran: `NotFound(null)`
 * and `Unauthorized(null)` from inside an action keep their status with an
 * empty body, and `Forbid()` / `Challenge()` go through the auth handler,
 * which writes an empty 403 / 401. What the JwtBearer challenge adds, and an
 * in-action `Unauthorized(null)` does not, is the `WWW-Authenticate: Bearer`
 * header, so the interceptor records that too. The definitive-failure rule for
 * CreateDocument and SendDocToIslandIs, and their 401 retry, depend on it. An
 * in-action `Challenge()` would still look like the pipeline's own challenge;
 * whether One's actions ever do that is a TODO(OneSystems) question in
 * `onesystems.errors.ts`.
 *
 * Both interceptors rely on the order the generated client (the fetch client
 * bundled by `@hey-api/openapi-ts`, pinned at 0.97.3) runs them in: response interceptors before the body is read, error interceptors
 * with the same `Response`. The spec rows in `onesystems.service.spec.ts` that
 * drive real `Response` objects through the client guard that order.
 */
export const ONESYSTEMS_EMPTY_ERROR_BODY: Readonly<Record<string, never>> =
  Object.freeze({})

/** {@link ONESYSTEMS_EMPTY_ERROR_BODY} for an empty 401 Bearer challenge. */
export const ONESYSTEMS_EMPTY_BEARER_CHALLENGE_BODY: Readonly<
  Record<string, never>
> = Object.freeze({})

/**
 * True when a `WWW-Authenticate` value's first challenge uses the Bearer
 * scheme (`Bearer`, or `Bearer error="invalid_token", ...`). Scheme names are
 * case-insensitive. A header whose first challenge is another scheme does not
 * count, which errs towards "not definitive".
 */
export function isBearerChallengeHeader(value: string | null): boolean {
  return value !== null && /^\s*bearer(?:\s|,|$)/i.test(value)
}

/** The marker for each non-2xx response whose raw body was empty. */
const emptyErrorBodyResponses = new WeakMap<
  Response,
  typeof ONESYSTEMS_EMPTY_ERROR_BODY
>()

oneSystemsActionClient.interceptors.response.use(async (response) => {
  if (!response.ok) {
    try {
      if ((await response.clone().text()).trim() === '') {
        emptyErrorBodyResponses.set(
          response,
          response.status === 401 &&
            isBearerChallengeHeader(response.headers.get('WWW-Authenticate'))
            ? ONESYSTEMS_EMPTY_BEARER_CHALLENGE_BODY
            : ONESYSTEMS_EMPTY_ERROR_BODY,
        )
      }
    } catch {
      // The body could not be read. The client's own read of it fails the
      // same way and reports that, so the response is left unmarked.
    }
  }
  return response
})

oneSystemsActionClient.interceptors.error.use(
  (error, response) =>
    (response !== undefined && emptyErrorBodyResponses.get(response)) || error,
)

/**
 * Client used only for Login. It is kept separate from the action client and
 * never has `auth` configured, so Login can never be sent with (or wait on) a
 * bearer token.
 */
export const oneSystemsLoginClient = createClient(createConfig<ClientOptions>())
