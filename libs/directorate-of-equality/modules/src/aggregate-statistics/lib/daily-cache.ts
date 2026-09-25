import { nextUtcMidnight } from './aggregate'

/** How long a stale value keeps being served after a failed refresh. */
export const RETRY_AFTER_FAILURE_MS = 5 * 60_000

export type CachedValue<T> = { value: T; expiresAt: Date }

/**
 * In-process cache for one value that is recomputed once a day, at midnight UTC.
 *
 * - Concurrent misses share a single computation instead of each scanning the register.
 * - A failed refresh keeps serving the last good value and retries after
 *   `RETRY_AFTER_FAILURE_MS`, rather than on every request.
 *
 * Per process: each API task holds its own copy, so `generatedAt` can differ by
 * the minutes between the first request each task receives after midnight.
 */
export class DailyCache<T> {
  private entry: CachedValue<T> | null = null
  private pending: Promise<CachedValue<T>> | null = null

  constructor(
    private readonly compute: (now: Date) => Promise<T>,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async get(): Promise<CachedValue<T>> {
    const now = this.now()
    if (this.entry && now < this.entry.expiresAt) {
      return this.entry
    }

    if (!this.pending) {
      this.pending = this.refresh(now).finally(() => {
        this.pending = null
      })
    }

    return this.pending
  }

  private async refresh(now: Date): Promise<CachedValue<T>> {
    try {
      const value = await this.compute(now)
      this.entry = { value, expiresAt: nextUtcMidnight(now) }
    } catch (error) {
      if (!this.entry) throw error
      this.entry = {
        value: this.entry.value,
        expiresAt: new Date(now.getTime() + RETRY_AFTER_FAILURE_MS),
      }
    }
    return this.entry
  }
}
