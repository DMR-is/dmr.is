import type { JWT } from 'next-auth/jwt'

import {
  isTransientRefreshError,
  REFRESH_TIMEOUT_MS,
  refreshAccessToken,
} from './token-service'

const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}

jest.mock('@dmr.is/logging-next', () => ({
  getLogger: () => mockLogger,
}))

/**
 * `refreshAccessToken` decodes the previous access token only to log how the
 * expiry moved, so any structurally valid JWT will do.
 */
const jwtWithExp = (expSeconds: number): string => {
  const encode = (value: object) =>
    Buffer.from(JSON.stringify(value))
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')

  return `${encode({ alg: 'RS256' })}.${encode({ exp: expSeconds })}.signature`
}

const tokenWithRefresh = (): JWT =>
  ({
    accessToken: jwtWithExp(Math.floor(Date.now() / 1000) + 60),
    idToken: jwtWithExp(Math.floor(Date.now() / 1000) + 60),
    refreshToken: 'refresh-token',
  }) as unknown as JWT

const jsonResponse = (status: number, body: unknown): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

describe('refreshAccessToken', () => {
  beforeEach(() => {
    process.env.IDENTITY_SERVER_DOMAIN = 'ids.example.is'
  })

  describe('transient failures (refresh token survives)', () => {
    it.each([408, 425, 429, 500, 502, 503, 504])(
      'throws TransientRefreshError on HTTP %i',
      async (status) => {
        global.fetch = jest
          .fn()
          .mockResolvedValue(jsonResponse(status, { error: 'server_error' }))

        const error = await refreshAccessToken(tokenWithRefresh()).catch(
          (e) => e,
        )

        expect(isTransientRefreshError(error)).toBe(true)
      },
    )

    it('throws TransientRefreshError when IDS cannot be reached', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('ECONNREFUSED'))

      const error = await refreshAccessToken(tokenWithRefresh()).catch((e) => e)

      expect(isTransientRefreshError(error)).toBe(true)
    })

    it('throws rather than returning an invalidated token, so the session survives', async () => {
      global.fetch = jest.fn().mockResolvedValue(jsonResponse(503, {}))

      await expect(refreshAccessToken(tokenWithRefresh())).rejects.toThrow()
    })

    it('does not choke on a non-JSON error body', async () => {
      global.fetch = jest
        .fn()
        .mockResolvedValue(new Response('<html>502</html>', { status: 502 }))

      const error = await refreshAccessToken(tokenWithRefresh()).catch((e) => e)

      expect(isTransientRefreshError(error)).toBe(true)
    })

    // A rotated client secret makes IDS answer 400 invalid_client for every
    // session at once. Ending them all would be a fleet-wide outage caused by
    // config, while every refresh token involved is still valid.
    it.each(['invalid_client', 'invalid_request', 'unauthorized_client'])(
      'does not end the session on %s',
      async (error) => {
        global.fetch = jest.fn().mockResolvedValue(jsonResponse(400, { error }))

        const thrown = await refreshAccessToken(tokenWithRefresh()).catch(
          (e) => e,
        )

        expect(isTransientRefreshError(thrown)).toBe(true)
      },
    )

    // Previously this reached the AccessTokenOrIdTokenMissing branch and ended
    // the session, because an unreadable body was indistinguishable from {}.
    it('does not end the session when a 200 body cannot be parsed', async () => {
      global.fetch = jest
        .fn()
        .mockResolvedValue(
          new Response('<html>gateway</html>', { status: 200 }),
        )

      const error = await refreshAccessToken(tokenWithRefresh()).catch((e) => e)

      expect(isTransientRefreshError(error)).toBe(true)
    })

    // The timeout has to cover the body, not just the headers: single-flight
    // shares one call between every collapsed request, so a body that never
    // finishes streaming would hang all of them.
    it('aborts a response whose body never finishes streaming', async () => {
      jest.useFakeTimers()

      global.fetch = jest.fn().mockImplementation((_url, init) => {
        const { signal } = init as RequestInit

        return Promise.resolve({
          ok: true,
          status: 200,
          // Real fetch ties the body stream to the request signal.
          json: () =>
            new Promise((_resolve, reject) => {
              signal?.addEventListener('abort', () =>
                reject(new Error('The operation was aborted')),
              )
            }),
        } as unknown as Response)
      })

      const settled = refreshAccessToken(tokenWithRefresh()).catch((e) => e)
      await jest.advanceTimersByTimeAsync(REFRESH_TIMEOUT_MS)

      expect(isTransientRefreshError(await settled)).toBe(true)

      jest.useRealTimers()
    })
  })

  describe('terminal failures (refresh token unusable)', () => {
    it('invalidates the token when IDS rejects the grant', async () => {
      global.fetch = jest
        .fn()
        .mockResolvedValue(jsonResponse(400, { error: 'invalid_grant' }))

      const result = await refreshAccessToken(tokenWithRefresh())

      expect(result.invalid).toBe(true)
      expect(result.error).toBe('invalid_grant')
    })

    it('invalidates the token when there is no refresh token to use', async () => {
      global.fetch = jest.fn()

      const result = await refreshAccessToken({} as JWT)

      expect(result.invalid).toBe(true)
      expect(result.error).toBe('RefreshTokenMissing')
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('invalidates the token when IDS answers 200 without tokens', async () => {
      global.fetch = jest
        .fn()
        .mockResolvedValue(jsonResponse(200, { expires_in: 3600 }))

      const result = await refreshAccessToken(tokenWithRefresh())

      expect(result.invalid).toBe(true)
      expect(result.error).toBe('AccessTokenOrIdTokenMissing')
    })
  })

  describe('success', () => {
    it('returns the new tokens without an invalid flag', async () => {
      global.fetch = jest.fn().mockResolvedValue(
        jsonResponse(200, {
          access_token: 'new-access',
          id_token: 'new-id',
          refresh_token: 'new-refresh',
          expires_in: 3600,
        }),
      )

      const result = await refreshAccessToken(tokenWithRefresh())

      expect(result).toMatchObject({
        accessToken: 'new-access',
        idToken: 'new-id',
        refreshToken: 'new-refresh',
      })
      expect(result.invalid).toBeUndefined()
    })

    it('keeps the current refresh token when IDS does not rotate it', async () => {
      global.fetch = jest.fn().mockResolvedValue(
        jsonResponse(200, {
          access_token: 'new-access',
          id_token: 'new-id',
          expires_in: 3600,
        }),
      )

      const result = await refreshAccessToken(tokenWithRefresh())

      expect(result.refreshToken).toBe('refresh-token')
    })
  })

  /**
   * These fields are the instrument for deciding whether DoE's IDS client is
   * misprovisioned relative to the others — whether its ID token is shorter-lived
   * than its access token, and whether it advances on refresh at all. Losing them
   * to a refactor would mean going back to decoding tokens by hand.
   */
  describe('refresh diagnostics', () => {
    const nowSeconds = () => Math.floor(Date.now() / 1000)

    const refreshWithIdToken = async (idTokenExp: number) => {
      global.fetch = jest.fn().mockResolvedValue(
        jsonResponse(200, {
          access_token: jwtWithExp(nowSeconds() + 300),
          id_token: jwtWithExp(idTokenExp),
          expires_in: 300,
        }),
      )

      await refreshAccessToken(tokenWithRefresh())

      const refreshed = mockLogger.info.mock.calls.find(
        ([message]) => message === 'Token refreshed',
      )
      return refreshed?.[1]?.metadata
    }

    it('reports that the ID token advanced', async () => {
      const metadata = await refreshWithIdToken(nowSeconds() + 300)

      expect(metadata).toMatchObject({ idTokenAdvanced: true })
      expect(metadata?.prevIdExpires).toBeDefined()
      expect(metadata?.newIdExpires).toBeDefined()
    })

    // The signature of H1b: DoE would then refresh on every single request.
    it('reports that the ID token did not advance', async () => {
      const metadata = await refreshWithIdToken(nowSeconds() + 60)

      expect(metadata).toMatchObject({ idTokenAdvanced: false })
    })

    it('does not fail a refresh when a token cannot be decoded', async () => {
      global.fetch = jest.fn().mockResolvedValue(
        jsonResponse(200, {
          access_token: 'not-a-jwt',
          id_token: 'not-a-jwt-either',
          expires_in: 300,
        }),
      )

      const result = await refreshAccessToken(tokenWithRefresh())

      expect(result.accessToken).toBe('not-a-jwt')
      expect(result.invalid).toBeUndefined()
    })
  })
})
