import {
  type OneSystemsToken,
  OneSystemsTokenCache,
  parseLoginResponse,
  TOKEN_EXPIRY_SKEW_MS,
  TOKEN_FALLBACK_LIFETIME_MS,
} from './onesystems-token'

const NOW = Date.UTC(2026, 8, 24, 12, 0, 0)

const base64url = (value: unknown) =>
  Buffer.from(JSON.stringify(value)).toString('base64url')

const makeJwt = (payload: Record<string, unknown>) =>
  `${base64url({ alg: 'HS256', typ: 'JWT' })}.${base64url(payload)}.c2lnbmF0dXJl`

describe('parseLoginResponse', () => {
  const EXP_SECONDS = NOW / 1_000 + 3_600
  const JWT = makeJwt({ sub: 'dmr', exp: EXP_SECONDS })
  const JWT_EXPIRES_AT = EXP_SECONDS * 1_000 - TOKEN_EXPIRY_SKEW_MS

  describe('accepted shapes', () => {
    it.each([
      ['a JSON string', JSON.stringify(JWT)],
      ['a JSON object with `token`', JSON.stringify({ token: JWT })],
      [
        'a JSON object with `access_token`',
        JSON.stringify({ access_token: JWT }),
      ],
      ['a JSON object with `Token`', JSON.stringify({ Token: JWT })],
      [
        'a JSON object with `accessToken`',
        JSON.stringify({ accessToken: JWT }),
      ],
      ['a raw JWT', JWT],
      ['a raw JWT with surrounding whitespace', `\n  ${JWT}  \n`],
      ['a raw JWT with a Bearer prefix', `Bearer ${JWT}`],
      ['a JSON string with a Bearer prefix', JSON.stringify(`Bearer ${JWT}`)],
    ])('reads the token from %s', (_label, body) => {
      expect(parseLoginResponse(body, NOW)).toEqual({
        value: JWT,
        expiresAt: JWT_EXPIRES_AT,
      })
    })

    it('checks the token keys in order', () => {
      const body = JSON.stringify({ accessToken: 'fourth', token: 'first' })

      expect(parseLoginResponse(body, NOW)?.value).toBe('first')
    })

    it('skips a key whose value is not a token and uses the next one', () => {
      const body = JSON.stringify({ token: null, access_token: 'opaque-123' })

      expect(parseLoginResponse(body, NOW)?.value).toBe('opaque-123')
    })

    it('accepts an opaque, non-JWT token inside JSON', () => {
      expect(parseLoginResponse('"abc.DEF-123_~+/=="', NOW)?.value).toBe(
        'abc.DEF-123_~+/==',
      )
    })
  })

  describe('garbage', () => {
    it.each([
      ['an empty body', ''],
      ['a whitespace-only body', '   \n'],
      ['an empty JSON object', '{}'],
      ['an object with none of the token keys', '{"jwt":"abc"}'],
      ['an object whose token is not a string', '{"token":12345}'],
      ['an object whose token is empty', '{"token":"  "}'],
      [
        'a JSON string holding an error message',
        '"Invalid username or password"',
      ],
      ['an empty JSON string', '""'],
      ['JSON null', 'null'],
      ['a JSON number', '12345'],
      ['a JSON boolean', 'true'],
      ['a JSON array', '["abc"]'],
      ['plain text that is not a JWT', 'Unauthorized'],
      ['an HTML error page', '<html><body>502 Bad Gateway</body></html>'],
      ['a raw two-segment value', 'abc.def'],
    ])('returns null for %s', (_label, body) => {
      expect(parseLoginResponse(body, NOW)).toBeNull()
    })
  })

  describe('expiry', () => {
    it('uses the JWT exp minus the skew, ignoring expires_in', () => {
      const body = JSON.stringify({ token: JWT, expires_in: 60 })

      expect(parseLoginResponse(body, NOW)?.expiresAt).toBe(JWT_EXPIRES_AT)
    })

    it('uses expires_in minus the skew when the token is not a JWT', () => {
      const body = JSON.stringify({ token: 'opaque', expires_in: 1_800 })

      expect(parseLoginResponse(body, NOW)?.expiresAt).toBe(
        NOW + 1_800_000 - TOKEN_EXPIRY_SKEW_MS,
      )
    })

    it('accepts expires_in as a numeric string', () => {
      const body = JSON.stringify({ token: 'opaque', expires_in: '1800' })

      expect(parseLoginResponse(body, NOW)?.expiresAt).toBe(
        NOW + 1_800_000 - TOKEN_EXPIRY_SKEW_MS,
      )
    })

    it('uses expires_in when the JWT has no exp claim', () => {
      const body = JSON.stringify({
        token: makeJwt({ sub: 'dmr' }),
        expires_in: 1_800,
      })

      expect(parseLoginResponse(body, NOW)?.expiresAt).toBe(
        NOW + 1_800_000 - TOKEN_EXPIRY_SKEW_MS,
      )
    })

    it.each([
      ['an opaque token with no expires_in', JSON.stringify('opaque')],
      ['a JWT with no exp', makeJwt({ sub: 'dmr' })],
      ['a JWT whose exp is not a number', makeJwt({ exp: 'soon' })],
      ['a JWT whose exp is negative', makeJwt({ exp: -1 })],
      [
        'a JWT-shaped value whose payload is not JSON',
        `${base64url({ alg: 'none' })}.bm90IGpzb24.sig`,
      ],
      ['a zero expires_in', JSON.stringify({ token: 'opaque', expires_in: 0 })],
      [
        'a non-numeric expires_in',
        JSON.stringify({ token: 'opaque', expires_in: 'an hour' }),
      ],
    ])('falls back to 10 minutes for %s', (_label, body) => {
      expect(parseLoginResponse(body, NOW)?.expiresAt).toBe(
        NOW + TOKEN_FALLBACK_LIFETIME_MS,
      )
    })

    it('pins the 60s skew and the 10 minute fallback', () => {
      expect(TOKEN_FALLBACK_LIFETIME_MS).toBe(600_000)
      expect(TOKEN_EXPIRY_SKEW_MS).toBe(60_000)
    })
  })
})

describe('OneSystemsTokenCache', () => {
  let now: number
  let cache: OneSystemsTokenCache

  const token = (value: string, lifetimeMs = 60_000): OneSystemsToken => ({
    value,
    expiresAt: now + lifetimeMs,
  })

  beforeEach(() => {
    jest.clearAllMocks()
    now = NOW
    cache = new OneSystemsTokenCache(() => now)
  })

  it('logs in on first use and reuses the token while it is valid', async () => {
    const login = jest.fn().mockResolvedValue(token('t1'))

    await expect(cache.get(login)).resolves.toBe('t1')
    now += 59_999
    await expect(cache.get(login)).resolves.toBe('t1')

    expect(login).toHaveBeenCalledTimes(1)
  })

  it('logs in again once the token has expired', async () => {
    const login = jest
      .fn()
      .mockResolvedValueOnce(token('t1'))
      .mockImplementationOnce(async () => token('t2'))

    await cache.get(login)
    now += 60_000

    await expect(cache.get(login)).resolves.toBe('t2')
    expect(login).toHaveBeenCalledTimes(2)
  })

  it('shares one Login between concurrent callers', async () => {
    let resolveLogin: (value: OneSystemsToken) => void = () => undefined
    const login = jest.fn(
      () =>
        new Promise<OneSystemsToken>((resolve) => {
          resolveLogin = resolve
        }),
    )

    const callers = Promise.all([
      cache.get(login),
      cache.get(login),
      cache.get(login),
    ])
    resolveLogin(token('shared'))

    await expect(callers).resolves.toEqual(['shared', 'shared', 'shared'])
    expect(login).toHaveBeenCalledTimes(1)
  })

  it('rejects every waiter when the shared Login fails, then tries afresh', async () => {
    const failure = new Error('login failed')
    const login = jest
      .fn()
      .mockRejectedValueOnce(failure)
      .mockResolvedValueOnce(token('t2'))

    const results = await Promise.allSettled([
      cache.get(login),
      cache.get(login),
    ])

    expect(results).toEqual([
      { status: 'rejected', reason: failure },
      { status: 'rejected', reason: failure },
    ])
    expect(login).toHaveBeenCalledTimes(1)

    await expect(cache.get(login)).resolves.toBe('t2')
    expect(login).toHaveBeenCalledTimes(2)
  })

  it('invalidate() drops the rejected token so the next call logs in', async () => {
    const login = jest
      .fn()
      .mockResolvedValueOnce(token('t1'))
      .mockResolvedValueOnce(token('t2'))

    await cache.get(login)
    cache.invalidate('t1')

    await expect(cache.get(login)).resolves.toBe('t2')
    expect(login).toHaveBeenCalledTimes(2)
  })

  it('invalidate() leaves a newer token alone', async () => {
    const login = jest
      .fn()
      .mockResolvedValueOnce(token('t1'))
      .mockResolvedValueOnce(token('t2'))

    await cache.get(login)
    cache.invalidate('t1')
    await cache.get(login)
    // A late 401 for the old token must not discard the fresh one.
    cache.invalidate('t1')

    await expect(cache.get(login)).resolves.toBe('t2')
    expect(login).toHaveBeenCalledTimes(2)
  })
})
