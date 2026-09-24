/**
 * OneExternalAPI Login token parsing and caching.
 *
 * The spec documents Login's response as an empty object, so its real shape is
 * unknown until the first live call. The parser therefore accepts every shape a
 * .NET token endpoint commonly returns and rejects anything else, rather than
 * guessing. Once a live Login has shown the real shape, narrow this.
 *
 * Nothing in this file logs. Callers must never log a token value.
 */

/** Refresh this long before the token's real expiry. */
export const TOKEN_EXPIRY_SKEW_MS = 60_000

/** Lifetime assumed when the response gives no expiry at all. */
export const TOKEN_FALLBACK_LIFETIME_MS = 10 * 60_000

/**
 * The computed expiry is clamped to at least this far from now, so a token
 * that is short-lived (or looks expired through clock skew) is still reused
 * for a moment instead of forcing a Login before every action.
 *
 * If One has really expired it, the action is answered with a 401, and the
 * one-time re-login-and-retry recovers it only where that retry fires: on
 * every 401 for CreateCase and CloseCase, but for CreateDocument and
 * SendDocToIslandIs only on the JwtBearer challenge (an empty-bodied 401 with
 * `WWW-Authenticate: Bearer`). If One's challenge does not look like that,
 * an expired token on either of those two leaves the delivery UNCERTAIN for a
 * person to check. It never sends a duplicate: the 401 is not retried.
 */
export const TOKEN_MIN_LIFETIME_MS = 30_000

/**
 * The computed expiry is clamped to at most this far from now, so a
 * nonsensical `exp` or `expires_in` cannot cache a token until a 401.
 */
export const TOKEN_MAX_LIFETIME_MS = 24 * 60 * 60_000

/**
 * A JWT `exp` above this is read as epoch milliseconds, not seconds. As
 * seconds it would be past the year 33000; as milliseconds it is 2001.
 */
const EXP_MILLISECONDS_THRESHOLD = 1e12

/** Object keys checked for the token, in order. */
const TOKEN_KEYS = ['token', 'access_token', 'Token', 'accessToken'] as const

/** Characters a bearer token may contain (RFC 6750 `b64token`). */
const TOKEN_PATTERN = /^[A-Za-z0-9\-._~+/]+=*$/

/** Three base64url segments separated by dots; the signature may be empty. */
const JWT_PATTERN = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*$/

export interface OneSystemsToken {
  value: string
  /** Epoch ms after which the token must not be used. */
  expiresAt: number
}

/**
 * Reads a token out of a raw Login response body.
 *
 * Accepted shapes:
 * - a JSON string: `"eyJ..."`
 * - a JSON object with `token`, `access_token`, `Token` or `accessToken`
 *   (checked in that order), optionally with `expires_in` in seconds
 * - a raw, unquoted JWT
 *
 * A leading `Bearer ` is stripped. Anything else, including a JSON string that
 * contains whitespace (which is far more likely an error message than a
 * token), returns `null`.
 *
 * Expiry is the JWT `exp` minus {@link TOKEN_EXPIRY_SKEW_MS} (an `exp` above
 * 1e12 is taken to be in milliseconds). Without a readable `exp` it is
 * `expires_in` minus the same skew, and without either it is
 * {@link TOKEN_FALLBACK_LIFETIME_MS} from `now`. The result is then clamped to
 * between {@link TOKEN_MIN_LIFETIME_MS} and {@link TOKEN_MAX_LIFETIME_MS} from
 * `now`.
 */
export function parseLoginResponse(
  body: string,
  now: number = Date.now(),
): OneSystemsToken | null {
  const text = body.trim()
  if (!text) {
    return null
  }

  let parsed: unknown
  let isJson = true
  try {
    parsed = JSON.parse(text)
  } catch {
    isJson = false
  }

  let value: string | null = null
  let expiresInSeconds: number | null = null

  if (!isJson) {
    const raw = stripBearer(text)
    value = JWT_PATTERN.test(raw) ? raw : null
  } else if (typeof parsed === 'string') {
    value = asTokenString(parsed)
  } else if (isRecord(parsed)) {
    for (const key of TOKEN_KEYS) {
      value = asTokenString(parsed[key])
      if (value) {
        break
      }
    }
    expiresInSeconds = asPositiveNumber(parsed.expires_in)
  }

  if (!value) {
    return null
  }

  return {
    value,
    expiresAt: computeExpiresAt(value, expiresInSeconds, now),
  }
}

function computeExpiresAt(
  value: string,
  expiresInSeconds: number | null,
  now: number,
): number {
  return Math.min(
    Math.max(
      unclampedExpiresAt(value, expiresInSeconds, now),
      now + TOKEN_MIN_LIFETIME_MS,
    ),
    now + TOKEN_MAX_LIFETIME_MS,
  )
}

function unclampedExpiresAt(
  value: string,
  expiresInSeconds: number | null,
  now: number,
): number {
  const exp = readJwtExp(value)
  if (exp !== null) {
    const expMs = exp > EXP_MILLISECONDS_THRESHOLD ? exp : exp * 1_000
    return expMs - TOKEN_EXPIRY_SKEW_MS
  }
  if (expiresInSeconds !== null) {
    return now + expiresInSeconds * 1_000 - TOKEN_EXPIRY_SKEW_MS
  }
  return now + TOKEN_FALLBACK_LIFETIME_MS
}

/**
 * The JWT `exp` claim as sent (epoch seconds, or milliseconds from a
 * non-conforming issuer), or `null` if it cannot be read.
 */
function readJwtExp(value: string): number | null {
  if (!JWT_PATTERN.test(value)) {
    return null
  }
  try {
    const payload: unknown = JSON.parse(
      Buffer.from(value.split('.')[1], 'base64url').toString('utf8'),
    )
    if (!isRecord(payload)) {
      return null
    }
    return asPositiveNumber(payload.exp)
  } catch {
    return null
  }
}

function asTokenString(input: unknown): string | null {
  if (typeof input !== 'string') {
    return null
  }
  const value = stripBearer(input.trim())
  return value && TOKEN_PATTERN.test(value) ? value : null
}

function stripBearer(input: string): string {
  return input.replace(/^Bearer\s+/i, '')
}

function asPositiveNumber(input: unknown): number | null {
  const n =
    typeof input === 'number'
      ? input
      : typeof input === 'string' && input.trim() !== ''
        ? Number(input)
        : NaN
  return Number.isFinite(n) && n > 0 ? n : null
}

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === 'object' && input !== null && !Array.isArray(input)
}

/**
 * Holds the current token and makes refresh single-flight: every caller that
 * finds the token missing or expired while a Login is already running waits on
 * that same Login instead of starting its own.
 *
 * A failed Login is not cached. Every waiter gets the rejection, and the next
 * caller starts a fresh Login.
 */
export class OneSystemsTokenCache {
  private current: OneSystemsToken | null = null
  private pending: Promise<OneSystemsToken> | null = null

  constructor(private readonly clock: () => number = Date.now) {}

  async get(login: () => Promise<OneSystemsToken>): Promise<string> {
    if (this.current && this.current.expiresAt > this.clock()) {
      return this.current.value
    }
    const token = await this.refresh(login)
    return token.value
  }

  /**
   * Drops the cached token if it is still the one that was rejected. Comparing
   * values keeps a 401 on an old token from discarding a newer token that a
   * concurrent refresh has already stored.
   */
  invalidate(rejected: string): void {
    if (this.current?.value === rejected) {
      this.current = null
    }
  }

  private refresh(
    login: () => Promise<OneSystemsToken>,
  ): Promise<OneSystemsToken> {
    if (!this.pending) {
      this.pending = login()
        .then((token) => {
          this.current = token
          return token
        })
        .finally(() => {
          this.pending = null
        })
    }
    return this.pending
  }
}
