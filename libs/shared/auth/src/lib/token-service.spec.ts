import type { JWT } from 'next-auth/jwt'

import { isTransientRefreshError, refreshAccessToken } from './token-service'

jest.mock('@dmr.is/logging-next', () => ({
  getLogger: () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  }),
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
})
