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

  it('retries after a transient failure rather than caching it', async () => {
    mockedRefresh
      .mockRejectedValueOnce(new TransientRefreshError('IDS unavailable'))
      .mockResolvedValueOnce(refreshed('new-access'))

    await expect(
      refreshAccessTokenOnce(tokenWith('shared-refresh')),
    ).rejects.toThrow()
    // The refresh token survived a transient failure, so the next request must
    // get a real attempt and not a replay of the error.
    const retried = await refreshAccessTokenOnce(tokenWith('shared-refresh'))

    expect(mockedRefresh).toHaveBeenCalledTimes(2)
    expect(retried.accessToken).toBe('new-access')
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
