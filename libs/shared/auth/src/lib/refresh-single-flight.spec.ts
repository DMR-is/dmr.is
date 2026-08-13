import type { JWT } from 'next-auth/jwt'

import {
  refreshAccessTokenOnce,
  resetRefreshSingleFlight,
} from './refresh-single-flight'
import { refreshAccessToken, TransientRefreshError } from './token-service'

jest.mock('@dmr.is/logging-next', () => ({
  getLogger: () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  }),
}))
// Keep the real error helpers and constants, stub only the call to IDS
jest.mock('./token-service', () => ({
  ...jest.requireActual('./token-service'),
  refreshAccessToken: jest.fn(),
}))

const mockedRefresh = refreshAccessToken as jest.MockedFunction<
  typeof refreshAccessToken
>

const tokenWith = (refreshToken?: string) =>
  ({
    accessToken: 'old-access',
    idToken: 'old-id',
    refreshToken,
  }) as unknown as JWT

const refreshed = (accessToken: string) =>
  ({
    accessToken,
    idToken: 'new-id',
    refreshToken: 'new-refresh',
  }) as unknown as Awaited<ReturnType<typeof refreshAccessToken>>

/**
 * A refresh result whose access token is a decodable JWT, so the reuse window is
 * derived from its lifetime rather than falling back to the cap.
 */
const refreshedWithAccessTokenExpiringIn = (seconds: number) => {
  const encode = (value: object) =>
    Buffer.from(JSON.stringify(value))
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')

  const exp = Math.floor(Date.now() / 1000) + seconds
  const jwt = `${encode({ alg: 'RS256' })}.${encode({ exp })}.signature`

  return refreshed(jwt)
}

/** A promise plus the handles to settle it, so timing can be controlled. */
const deferred = <T>() => {
  let resolve!: (value: T) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe('refreshAccessTokenOnce', () => {
  beforeEach(() => {
    resetRefreshSingleFlight()
  })

  it('collapses concurrent refreshes of the same token into one call to IDS', async () => {
    const flight = deferred<Awaited<ReturnType<typeof refreshAccessToken>>>()
    mockedRefresh.mockReturnValue(flight.promise)

    // What a single page load looks like: document, RSC, prefetch, tRPC batch.
    const requests = Array.from({ length: 4 }, () =>
      refreshAccessTokenOnce(tokenWith('shared-refresh')),
    )
    flight.resolve(refreshed('new-access'))
    const results = await Promise.all(requests)

    expect(mockedRefresh).toHaveBeenCalledTimes(1)
    // Every request must end up writing the same cookie, or the last response
    // to land decides which tokens the browser keeps.
    for (const result of results) {
      expect(result.accessToken).toBe('new-access')
    }
  })

  it('hands a straggler the completed refresh instead of replaying it', async () => {
    mockedRefresh.mockResolvedValue(refreshed('new-access'))

    await refreshAccessTokenOnce(tokenWith('shared-refresh'))
    // Arrives afterwards still carrying the old cookie — e.g. the 60s NextAuth
    // session poll overwrote the refreshed one. IDS has already burned this
    // refresh token, so calling again would answer invalid_grant.
    const straggler = await refreshAccessTokenOnce(tokenWith('shared-refresh'))

    expect(mockedRefresh).toHaveBeenCalledTimes(1)
    expect(straggler.accessToken).toBe('new-access')
  })

  it('does not reuse a result across different refresh tokens', async () => {
    mockedRefresh
      .mockResolvedValueOnce(refreshed('first'))
      .mockResolvedValueOnce(refreshed('second'))

    const first = await refreshAccessTokenOnce(tokenWith('refresh-a'))
    const second = await refreshAccessTokenOnce(tokenWith('refresh-b'))

    expect(mockedRefresh).toHaveBeenCalledTimes(2)
    expect(first.accessToken).toBe('first')
    expect(second.accessToken).toBe('second')
  })

  it('shares a terminal result, so concurrent requests agree the session is over', async () => {
    mockedRefresh.mockResolvedValue({
      ...tokenWith('shared-refresh'),
      invalid: true,
      error: 'invalid_grant',
    } as Awaited<ReturnType<typeof refreshAccessToken>>)

    const results = await Promise.all([
      refreshAccessTokenOnce(tokenWith('shared-refresh')),
      refreshAccessTokenOnce(tokenWith('shared-refresh')),
    ])

    expect(mockedRefresh).toHaveBeenCalledTimes(1)
    expect(results.every((result) => result.invalid)).toBe(true)
  })

  it('shares a transient failure with everyone waiting on it', async () => {
    const flight = deferred<Awaited<ReturnType<typeof refreshAccessToken>>>()
    mockedRefresh.mockReturnValue(flight.promise)

    const requests = [
      refreshAccessTokenOnce(tokenWith('shared-refresh')).catch((e) => e),
      refreshAccessTokenOnce(tokenWith('shared-refresh')).catch((e) => e),
    ]
    flight.reject(new TransientRefreshError('Identity server unavailable'))
    const results = await Promise.all(requests)

    expect(mockedRefresh).toHaveBeenCalledTimes(1)
    expect(results.every((error) => error instanceof Error)).toBe(true)
  })

  describe('failure backoff', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    // Otherwise an IDS outage turns every incoming request into its own call to
    // /connect/token — and since 429 is transient, being rate-limited would make
    // us generate more traffic.
    it('replays a transient failure for the backoff window', async () => {
      mockedRefresh.mockRejectedValue(new TransientRefreshError('unavailable'))

      await expect(
        refreshAccessTokenOnce(tokenWith('shared-refresh')),
      ).rejects.toThrow()
      await expect(
        refreshAccessTokenOnce(tokenWith('shared-refresh')),
      ).rejects.toThrow()

      expect(mockedRefresh).toHaveBeenCalledTimes(1)
    })

    it('attempts again once the backoff window has passed', async () => {
      mockedRefresh
        .mockRejectedValueOnce(new TransientRefreshError('unavailable'))
        .mockResolvedValueOnce(refreshed('new-access'))

      await expect(
        refreshAccessTokenOnce(tokenWith('shared-refresh')),
      ).rejects.toThrow()
      await jest.advanceTimersByTimeAsync(2500)
      const retried = await refreshAccessTokenOnce(tokenWith('shared-refresh'))

      expect(mockedRefresh).toHaveBeenCalledTimes(2)
      expect(retried.accessToken).toBe('new-access')
    })

    // Leaving the session intact is right for a blip and wrong forever: isExpired
    // keeps returning true, so without a ceiling the user sits on a silently
    // 401-ing UI while we retry against IDS indefinitely.
    it('ends the session once retrying is no longer plausible', async () => {
      mockedRefresh.mockRejectedValue(new TransientRefreshError('unavailable'))

      let lastResult: Awaited<
        ReturnType<typeof refreshAccessTokenOnce>
      > | null = null

      for (let attempt = 0; attempt < 5; attempt++) {
        lastResult = await refreshAccessTokenOnce(
          tokenWith('shared-refresh'),
        ).catch(() => null)
        await jest.advanceTimersByTimeAsync(31_000)
      }

      expect(mockedRefresh).toHaveBeenCalledTimes(5)
      expect(lastResult).toMatchObject({
        invalid: true,
        error: 'RefreshRetriesExhausted',
      })
    })

    // Pins the real cost of the ceiling. Both conditions must hold, so the count
    // alone is reached in ~30s and it is the 2-minute span that decides. Under
    // continuous traffic the doubling backoff makes that ~8 attempts — the test
    // above reaches it in 5 because sparse traffic accumulates span faster than
    // it accumulates attempts.
    it('reaches the ceiling in about eight attempts over two minutes', async () => {
      mockedRefresh.mockRejectedValue(new TransientRefreshError('unavailable'))

      const startedAt = Date.now()
      let ended: { invalid?: boolean; error?: string } | null = null

      // A busy tab: keep asking every second until the session is declared over.
      for (let tick = 0; tick < 400 && ended === null; tick++) {
        const result = await refreshAccessTokenOnce(
          tokenWith('shared-refresh'),
        ).catch(() => null)

        if (result?.invalid) {
          ended = result
          break
        }

        await jest.advanceTimersByTimeAsync(1_000)
      }

      expect(ended).toMatchObject({ error: 'RefreshRetriesExhausted' })
      expect(mockedRefresh).toHaveBeenCalledTimes(8)
      expect(Date.now() - startedAt).toBeGreaterThanOrEqual(120_000)
    })

    it('forgets the failure run after a success', async () => {
      mockedRefresh
        .mockRejectedValueOnce(new TransientRefreshError('unavailable'))
        .mockResolvedValueOnce(refreshed('new-access'))
        .mockRejectedValue(new TransientRefreshError('unavailable'))

      await expect(
        refreshAccessTokenOnce(tokenWith('shared-refresh')),
      ).rejects.toThrow()
      await jest.advanceTimersByTimeAsync(2500)
      await refreshAccessTokenOnce(tokenWith('shared-refresh'))

      // Back to the shortest backoff rather than partway up the ladder.
      await expect(
        refreshAccessTokenOnce(tokenWith('other-refresh')),
      ).rejects.toThrow()
      await jest.advanceTimersByTimeAsync(2500)
      await expect(
        refreshAccessTokenOnce(tokenWith('other-refresh')),
      ).rejects.toThrow()

      expect(mockedRefresh).toHaveBeenCalledTimes(4)
    })
  })

  describe('reuse window', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    // The straggler cache is only safe while it closes before the next refresh is
    // due, or it could hand back a refresh token that has since been rotated.
    it('closes the window well before the next refresh falls due', async () => {
      mockedRefresh.mockResolvedValue(refreshedWithAccessTokenExpiringIn(40))

      await refreshAccessTokenOnce(tokenWith('shared-refresh'))
      await jest.advanceTimersByTimeAsync(25_000)
      await refreshAccessTokenOnce(tokenWith('shared-refresh'))

      expect(mockedRefresh).toHaveBeenCalledTimes(2)
    })

    it('still serves stragglers inside the window', async () => {
      mockedRefresh.mockResolvedValue(refreshedWithAccessTokenExpiringIn(40))

      await refreshAccessTokenOnce(tokenWith('shared-refresh'))
      await jest.advanceTimersByTimeAsync(5_000)
      await refreshAccessTokenOnce(tokenWith('shared-refresh'))

      expect(mockedRefresh).toHaveBeenCalledTimes(1)
    })
  })

  it('passes through when there is no refresh token to key on', async () => {
    mockedRefresh.mockResolvedValue({
      ...tokenWith(undefined),
      invalid: true,
      error: 'RefreshTokenMissing',
    } as Awaited<ReturnType<typeof refreshAccessToken>>)

    await refreshAccessTokenOnce(tokenWith(undefined))
    await refreshAccessTokenOnce(tokenWith(undefined))

    expect(mockedRefresh).toHaveBeenCalledTimes(2)
  })

  it('forwards the caller credentials to the underlying refresh', async () => {
    mockedRefresh.mockResolvedValue(refreshed('new-access'))

    const token = tokenWith('shared-refresh')
    await refreshAccessTokenOnce(
      token,
      'https://web.example.is',
      'client-id',
      'client-secret',
    )

    expect(mockedRefresh).toHaveBeenCalledWith(
      token,
      'https://web.example.is',
      'client-id',
      'client-secret',
    )
  })
})
