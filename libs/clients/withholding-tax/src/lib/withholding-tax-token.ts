/** Refresh this long before the token's stated expiry. */
export const TOKEN_EXPIRY_SKEW_MS = 60_000

/** Lifetime assumed when `/token` gives no `expires_in`. */
export const TOKEN_FALLBACK_LIFETIME_MS = 10 * 60_000

export interface WithholdingTaxToken {
  value: string
  /** Epoch ms after which the token must not be used. */
  expiresAt: number
}

export function tokenExpiresAt(
  expiresInSeconds: number | undefined,
  now: number,
): number {
  if (expiresInSeconds === undefined) {
    return now + TOKEN_FALLBACK_LIFETIME_MS
  }
  return now + Math.max(expiresInSeconds * 1_000 - TOKEN_EXPIRY_SKEW_MS, 0)
}

/**
 * Holds the current token and makes refresh single-flight: callers that find
 * it missing or expired while a login is running wait on that login.
 * A failed login is not cached; the next caller starts a fresh one.
 */
export class WithholdingTaxTokenCache {
  private current: WithholdingTaxToken | null = null
  private pending: Promise<WithholdingTaxToken> | null = null

  constructor(private readonly clock: () => number = Date.now) {}

  async get(login: () => Promise<WithholdingTaxToken>): Promise<string> {
    if (this.current && this.current.expiresAt > this.clock()) {
      return this.current.value
    }
    return (await this.refresh(login)).value
  }

  /** Logs in again whatever is cached. Joins a login already running. */
  async refreshNow(login: () => Promise<WithholdingTaxToken>): Promise<string> {
    return (await this.refresh(login)).value
  }

  /**
   * Drops the cached token if it is still the rejected one, so a 401 on an old
   * token cannot discard a newer one a concurrent refresh already stored.
   */
  invalidate(rejected: string): void {
    if (this.current?.value === rejected) {
      this.current = null
    }
  }

  private refresh(
    login: () => Promise<WithholdingTaxToken>,
  ): Promise<WithholdingTaxToken> {
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
