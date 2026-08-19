import * as jwt from 'jsonwebtoken'
import { generateKeyPairSync } from 'node:crypto'

import {
  ExecutionContext,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common'

import { PostholfCallbackGuard } from './postholf-callback.guard'

const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

const ISSUER = 'https://issuer.test'
const AUDIENCE = 'doe-postholf'
const SCOPE = '@dmr.is/postholf'
const JWKS_URI = 'https://issuer.test/.well-known/jwks.json'
const KID = 'test-kid'

// A real keypair, so signature, issuer, audience and expiry are verified by
// jsonwebtoken itself rather than by a mock that could accept anything. Only the
// JWKS lookup is stubbed — that is the one part that needs the network.
const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
})

const otherKeyPair = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
})

const getSigningKey = jest.fn()

jest.mock('jwks-rsa', () => ({
  __esModule: true,
  default: jest.fn(() => ({ getSigningKey })),
}))

const sign = (
  payload: Record<string, unknown>,
  options: jwt.SignOptions = {},
  key: string = privateKey,
) =>
  jwt.sign(payload, key, {
    algorithm: 'RS256',
    keyid: KID,
    issuer: ISSUER,
    audience: AUDIENCE,
    expiresIn: '5m',
    ...options,
  })

const contextWith = (authorization?: string) =>
  ({
    switchToHttp: () => ({
      getRequest: () => ({ headers: authorization ? { authorization } : {} }),
    }),
  }) as unknown as ExecutionContext

const ENV = {
  POSTHOLF_CALLBACK_JWKS_URI: JWKS_URI,
  POSTHOLF_CALLBACK_ISSUER: ISSUER,
  POSTHOLF_CALLBACK_AUDIENCE: AUDIENCE,
  POSTHOLF_CALLBACK_SCOPE: SCOPE,
}

describe('PostholfCallbackGuard', () => {
  let guard: PostholfCallbackGuard

  beforeEach(() => {
    jest.clearAllMocks()
    Object.assign(process.env, ENV)
    getSigningKey.mockResolvedValue({ getPublicKey: () => publicKey })
    guard = new PostholfCallbackGuard(mockLogger as never)
  })

  afterEach(() => {
    for (const key of Object.keys(ENV)) delete process.env[key]
  })

  it('accepts a token with a valid signature, issuer, audience and scope', async () => {
    const token = sign({ scope: SCOPE })

    await expect(
      guard.canActivate(contextWith(`Bearer ${token}`)),
    ).resolves.toBe(true)
  })

  it('looks the key up by the token’s kid', async () => {
    await guard.canActivate(contextWith(`Bearer ${sign({ scope: SCOPE })}`))

    expect(getSigningKey).toHaveBeenCalledWith(KID)
  })

  describe('scope claim shapes', () => {
    // Which issuer signs the inbound token is unresolved (island.is IDS vs
    // Entra), and they spell the claim differently. Both are accepted rather
    // than guessed.
    it.each([
      ['scope as a space-delimited string', { scope: `other ${SCOPE} more` }],
      ['scp as a string', { scp: SCOPE }],
      ['scp as an array', { scp: ['other', SCOPE] }],
    ])('accepts %s', async (_label, claims) => {
      await expect(
        guard.canActivate(contextWith(`Bearer ${sign(claims)}`)),
      ).resolves.toBe(true)
    })

    it('does not accept a scope that merely contains the required one as a substring', async () => {
      await expect(
        guard.canActivate(
          contextWith(`Bearer ${sign({ scope: `${SCOPE}-readonly` })}`),
        ),
      ).rejects.toThrow(UnauthorizedException)
    })
  })

  describe('rejections', () => {
    it('rejects a missing Authorization header', async () => {
      await expect(guard.canActivate(contextWith())).rejects.toThrow(
        UnauthorizedException,
      )
    })

    it('rejects a non-Bearer scheme', async () => {
      await expect(
        guard.canActivate(contextWith('Basic dXNlcjpwYXNz')),
      ).rejects.toThrow(UnauthorizedException)
    })

    it('rejects an empty Bearer token', async () => {
      await expect(guard.canActivate(contextWith('Bearer   '))).rejects.toThrow(
        UnauthorizedException,
      )
    })

    it('rejects a token signed by a different key', async () => {
      const token = sign({ scope: SCOPE }, {}, otherKeyPair.privateKey)

      await expect(
        guard.canActivate(contextWith(`Bearer ${token}`)),
      ).rejects.toThrow(UnauthorizedException)
    })

    it('rejects a wrong issuer', async () => {
      const token = sign({ scope: SCOPE }, { issuer: 'https://elsewhere.test' })

      await expect(
        guard.canActivate(contextWith(`Bearer ${token}`)),
      ).rejects.toThrow(UnauthorizedException)
    })

    it('rejects a wrong audience', async () => {
      // The gap `TokenJwtAuthGuard` leaves open, and the reason this guard exists.
      const token = sign({ scope: SCOPE }, { audience: 'someone-else' })

      await expect(
        guard.canActivate(contextWith(`Bearer ${token}`)),
      ).rejects.toThrow(UnauthorizedException)
    })

    it('rejects an expired token', async () => {
      const token = sign({ scope: SCOPE }, { expiresIn: '-1h' })

      await expect(
        guard.canActivate(contextWith(`Bearer ${token}`)),
      ).rejects.toThrow(UnauthorizedException)
    })

    it('rejects a token with no scope claim', async () => {
      await expect(
        guard.canActivate(contextWith(`Bearer ${sign({})}`)),
      ).rejects.toThrow(UnauthorizedException)
    })

    it('rejects a token with the wrong scope', async () => {
      await expect(
        guard.canActivate(contextWith(`Bearer ${sign({ scope: 'other' })}`)),
      ).rejects.toThrow(UnauthorizedException)
    })

    it('rejects an unsigned (alg: none) token', async () => {
      const token = jwt.sign({ scope: SCOPE, iss: ISSUER, aud: AUDIENCE }, '', {
        algorithm: 'none',
      })

      await expect(
        guard.canActivate(contextWith(`Bearer ${token}`)),
      ).rejects.toThrow(UnauthorizedException)
    })
  })

  describe('configuration', () => {
    it.each(Object.keys(ENV))(
      'refuses to authenticate when %s is missing',
      async (missing) => {
        delete process.env[missing]

        // A half-configured guard on an endpoint that serves legal documents is
        // worse than a broken one, because it looks like it works.
        await expect(
          guard.canActivate(contextWith(`Bearer ${sign({ scope: SCOPE })}`)),
        ).rejects.toThrow(InternalServerErrorException)
      },
    )
  })
})
