import { generateKeyPairSync } from 'crypto'
import * as jwt from 'jsonwebtoken'

import {
  ExecutionContext,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common'

import { type Logger } from '@dmr.is/logging'

import { TokenJwtAuthGuard } from './token-auth.guard'

const mockGetSigningKey = jest.fn()

jest.mock('jwks-rsa', () => {
  const actual = jest.requireActual('jwks-rsa')
  return {
    __esModule: true,
    ...actual,
    default: () => ({ getSigningKey: mockGetSigningKey }),
  }
})

const { SigningKeyNotFoundError, JwksError, JwksRateLimitError } =
  jest.requireActual('jwks-rsa')

const keyPair = () =>
  generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  })

describe('TokenJwtAuthGuard', () => {
  const issuerDomain = 'ids.example.is'
  const signingKeys = keyPair()
  const otherKeys = keyPair()
  const logger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  } as unknown as Logger

  let guard: TokenJwtAuthGuard

  const sign = (privateKey = signingKeys.privateKey) =>
    jwt.sign({ sub: 'user-1', nationalId: '0101302399' }, privateKey, {
      algorithm: 'RS256',
      issuer: `https://${issuerDomain}`,
      keyid: 'kid-1',
    })

  const context = (authorization?: string) => {
    const request = { headers: authorization ? { authorization } : {} }
    return {
      request,
      ctx: {
        switchToHttp: () => ({ getRequest: () => request }),
      } as unknown as ExecutionContext,
    }
  }

  beforeAll(() => {
    process.env.IDENTITY_SERVER_DOMAIN = issuerDomain
    guard = new TokenJwtAuthGuard(logger)
  })

  beforeEach(() => {
    jest.clearAllMocks()
    mockGetSigningKey.mockReset()
  })

  it('accepts a valid token and attaches the user', async () => {
    mockGetSigningKey.mockResolvedValue({
      getPublicKey: () => signingKeys.publicKey,
    })
    const { ctx, request } = context(`Bearer ${sign()}`)

    await expect(guard.canActivate(ctx)).resolves.toBe(true)
    expect(request).toMatchObject({ user: { sub: 'user-1' } })
  })

  it('rejects a missing authorization header with 401', async () => {
    await expect(guard.canActivate(context().ctx)).rejects.toThrow(
      UnauthorizedException,
    )
  })

  it('rejects a token signed with another key with 401', async () => {
    mockGetSigningKey.mockResolvedValue({
      getPublicKey: () => signingKeys.publicKey,
    })

    await expect(
      guard.canActivate(context(`Bearer ${sign(otherKeys.privateKey)}`).ctx),
    ).rejects.toThrow(UnauthorizedException)
  })

  it('rejects a token with an unknown key id with 401', async () => {
    mockGetSigningKey.mockRejectedValue(
      new SigningKeyNotFoundError('Unable to find a signing key'),
    )

    await expect(
      guard.canActivate(context(`Bearer ${sign()}`).ctx),
    ).rejects.toThrow(UnauthorizedException)
  })

  it('rejects with 401, not 503, when key lookups hit the rate limit', async () => {
    mockGetSigningKey.mockRejectedValue(
      new JwksRateLimitError('Too many requests to the JWKS endpoint'),
    )

    await expect(
      guard.canActivate(context(`Bearer ${sign()}`).ctx),
    ).rejects.toThrow(UnauthorizedException)
    expect(logger.error).not.toHaveBeenCalled()
  })

  it.each([
    ['the identity server returns an error', new JwksError('Not Found')],
    ['the identity server is unreachable', new Error('connect ECONNREFUSED')],
  ])('answers 503, not 401, when %s', async (_label, error) => {
    mockGetSigningKey.mockRejectedValue(error)

    await expect(
      guard.canActivate(context(`Bearer ${sign()}`).ctx),
    ).rejects.toThrow(ServiceUnavailableException)
  })
})
