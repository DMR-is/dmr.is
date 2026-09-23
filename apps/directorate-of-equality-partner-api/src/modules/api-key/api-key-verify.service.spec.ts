import { UnauthorizedException } from '@nestjs/common'
import { getModelToken } from '@nestjs/sequelize'
import { Test } from '@nestjs/testing'

import {
  PartnerClientKeyModel,
  PartnerClientModel,
} from '@dmr.is/doe-modules/partner-client'
import {
  ApiKeyKindEnum,
  ApiKeyModel,
  ApiKeyScopeEnum,
  buildApiKey,
  generateApiKey,
  hashApiKeySecret,
} from '@dmr.is/doe-shared'
import { LOGGER_PROVIDER } from '@dmr.is/logging'

import { ApiKeyVerifyService } from './api-key-verify.service'

const HMAC = 'spec-hmac-secret-long-enough-to-pass-the-floor'

const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

describe('ApiKeyVerifyService', () => {
  let service: ApiKeyVerifyService
  let findOne: jest.Mock
  let clientKeyFindOne: jest.Mock
  let clientFindByPk: jest.Mock
  let update: jest.Mock

  /** A persisted row for `key`, with whatever lifecycle state the test needs. */
  const rowFor = (secret: string, overrides: Record<string, unknown> = {}) => {
    update = jest.fn().mockResolvedValue(undefined)
    return {
      id: 'row-1',
      keyId: 'aaaaaaaaaaaaaaa1',
      secretHash: hashApiKeySecret(secret, HMAC),
      companyId: 'company-1',
      companyNationalId: '5501012130',
      scopes: [ApiKeyScopeEnum.SALARY_SUBMIT],
      revokedAt: null,
      expiresAt: null,
      update,
      ...overrides,
    }
  }

  beforeEach(async () => {
    jest.clearAllMocks()
    process.env.DOE_API_KEY_HMAC_SECRET = HMAC

    findOne = jest.fn()
    clientKeyFindOne = jest.fn()
    clientFindByPk = jest.fn()

    const module = await Test.createTestingModule({
      providers: [
        ApiKeyVerifyService,
        { provide: LOGGER_PROVIDER, useValue: mockLogger },
        { provide: getModelToken(ApiKeyModel), useValue: { findOne } },
        {
          provide: getModelToken(PartnerClientKeyModel),
          useValue: { findOne: clientKeyFindOne },
        },
        {
          provide: getModelToken(PartnerClientModel),
          useValue: { findByPk: clientFindByPk },
        },
      ],
    }).compile()

    service = module.get(ApiKeyVerifyService)
  })

  afterEach(() => {
    delete process.env.DOE_API_KEY_HMAC_SECRET
  })

  it('resolves a live key to its company and scopes', async () => {
    const generated = generateApiKey('dev')
    findOne.mockResolvedValue(rowFor(generated.secret))

    await expect(service.verify(generated.key)).resolves.toEqual({
      kind: ApiKeyKindEnum.COMPANY,
      id: 'row-1',
      keyId: 'aaaaaaaaaaaaaaa1',
      companyId: 'company-1',
      companyNationalId: '5501012130',
      scopes: [ApiKeyScopeEnum.SALARY_SUBMIT],
    })
  })

  it('looks the key up by its public half only', async () => {
    const generated = generateApiKey('dev')
    findOne.mockResolvedValue(rowFor(generated.secret))

    await service.verify(generated.key)

    expect(findOne).toHaveBeenCalledWith({
      where: { keyId: generated.keyId },
    })
  })

  it('returns no secret or hash in the context', async () => {
    const generated = generateApiKey('dev')
    findOne.mockResolvedValue(rowFor(generated.secret))

    const context = await service.verify(generated.key)

    expect(JSON.stringify(context)).not.toContain(generated.secret)
    expect(context).not.toHaveProperty('secretHash')
  })

  describe('rejections', () => {
    it('rejects a malformed credential without hitting the database', async () => {
      await expect(service.verify('not-a-key')).rejects.toBeInstanceOf(
        UnauthorizedException,
      )
      expect(findOne).not.toHaveBeenCalled()
    })

    it('rejects an unknown keyId', async () => {
      findOne.mockResolvedValue(null)

      await expect(
        service.verify(generateApiKey('dev').key),
      ).rejects.toBeInstanceOf(UnauthorizedException)
    })

    it('rejects the wrong secret for a known keyId', async () => {
      findOne.mockResolvedValue(rowFor(generateApiKey('dev').secret))

      await expect(
        service.verify(generateApiKey('dev').key),
      ).rejects.toBeInstanceOf(UnauthorizedException)
    })

    // The two checks verifyApiKeySecret cannot make, because it takes a hash
    // rather than a row. Without these the revoke button is cosmetic.
    it('rejects a REVOKED key whose secret is still correct', async () => {
      const generated = generateApiKey('dev')
      findOne.mockResolvedValue(
        rowFor(generated.secret, { revokedAt: new Date('2026-01-01') }),
      )

      await expect(service.verify(generated.key)).rejects.toBeInstanceOf(
        UnauthorizedException,
      )
    })

    it('rejects an EXPIRED key whose secret is still correct', async () => {
      const generated = generateApiKey('dev')
      findOne.mockResolvedValue(
        rowFor(generated.secret, { expiresAt: new Date(Date.now() - 1000) }),
      )

      await expect(service.verify(generated.key)).rejects.toBeInstanceOf(
        UnauthorizedException,
      )
    })

    it('accepts a key whose expiry is still in the future', async () => {
      const generated = generateApiKey('dev')
      findOne.mockResolvedValue(
        rowFor(generated.secret, { expiresAt: new Date(Date.now() + 60_000) }),
      )

      await expect(service.verify(generated.key)).resolves.toBeDefined()
    })

    it('gives every rejection the same message, so it cannot be used as an oracle', async () => {
      const generated = generateApiKey('dev')
      const messages: string[] = []

      const cases: Array<[string, unknown]> = [
        ['malformed', null],
        ['unknown', null],
        ['wrong secret', rowFor(generateApiKey('dev').secret)],
        ['revoked', rowFor(generated.secret, { revokedAt: new Date() })],
        [
          'expired',
          rowFor(generated.secret, { expiresAt: new Date(Date.now() - 1) }),
        ],
      ]

      for (const [label, row] of cases) {
        findOne.mockResolvedValue(row)
        try {
          await service.verify(label === 'malformed' ? 'nope' : generated.key)
        } catch (error) {
          messages.push((error as Error).message)
        }
      }

      expect(messages).toHaveLength(5)
      expect(new Set(messages).size).toBe(1)
      expect(messages[0]).toBe('Invalid API key')
    })

    it("does not answer 401 when the HMAC secret is missing — that is our fault, not the caller's", async () => {
      delete process.env.DOE_API_KEY_HMAC_SECRET
      const generated = generateApiKey('dev')
      findOne.mockResolvedValue(rowFor(generated.secret))

      await expect(service.verify(generated.key)).rejects.not.toBeInstanceOf(
        UnauthorizedException,
      )
    })
  })

  describe('last_used_at', () => {
    it('records first use', async () => {
      const generated = generateApiKey('dev')
      findOne.mockResolvedValue(rowFor(generated.secret))

      await service.verify(generated.key)

      expect(update).toHaveBeenCalledWith({ lastUsedAt: expect.any(Date) })
    })

    it('does not write again within the touch interval', async () => {
      const generated = generateApiKey('dev')
      const row = rowFor(generated.secret)
      findOne.mockResolvedValue(row)

      await service.verify(generated.key)
      await service.verify(generated.key)
      await service.verify(generated.key)

      // Authenticating is a read; three requests must not be three writes.
      expect(row.update).toHaveBeenCalledTimes(1)
    })

    it('still authenticates when the bookkeeping write fails', async () => {
      const generated = generateApiKey('dev')
      const row = rowFor(generated.secret)
      row.update = jest.fn().mockRejectedValue(new Error('db down'))
      findOne.mockResolvedValue(row)

      await expect(service.verify(generated.key)).resolves.toBeDefined()
    })
  })

  it('accepts a key built by hand from its parts, not just one from generateApiKey', async () => {
    // Guards against the verify path depending on some incidental property of
    // the generator rather than on the format.
    const secret = 'a'.repeat(43)
    const raw = buildApiKey('dev', 'b'.repeat(16), secret)
    findOne.mockResolvedValue(rowFor(secret, { keyId: 'b'.repeat(16) }))

    await expect(service.verify(raw)).resolves.toBeDefined()
  })

  /**
   * A `doev_` key is looked up in the client key table only, checked the same
   * way, and then refused if its firm has been revoked — revoking a firm leaves
   * its keys as they are, so a live key under a revoked firm is the case that
   * matters.
   */
  describe('vendor client keys', () => {
    const clientKeyRow = (
      secret: string,
      overrides: Record<string, unknown> = {},
    ) => {
      update = jest.fn().mockResolvedValue(undefined)
      return {
        id: 'client-key-1',
        keyId: 'bbbbbbbbbbbbbbb1',
        partnerClientId: 'client-1',
        secretHash: hashApiKeySecret(secret, HMAC),
        revokedAt: null,
        expiresAt: null,
        update,
        ...overrides,
      }
    }

    const liveClient = {
      id: 'client-1',
      scopes: [ApiKeyScopeEnum.REPORT_READ, ApiKeyScopeEnum.SALARY_SUBMIT],
      revokedAt: null,
    }

    it('resolves to the firm and its scopes, looking only in the client key table', async () => {
      const generated = generateApiKey('dev', ApiKeyKindEnum.PARTNER_CLIENT)
      clientKeyFindOne.mockResolvedValue(clientKeyRow(generated.secret))
      clientFindByPk.mockResolvedValue(liveClient)

      await expect(service.verify(generated.key)).resolves.toEqual({
        kind: ApiKeyKindEnum.PARTNER_CLIENT,
        id: 'client-key-1',
        keyId: 'bbbbbbbbbbbbbbb1',
        partnerClientId: 'client-1',
        scopes: liveClient.scopes,
      })
      expect(clientKeyFindOne).toHaveBeenCalledWith({
        where: { keyId: generated.keyId },
      })
      expect(findOne).not.toHaveBeenCalled()
    })

    it('never looks a company key up in the client key table', async () => {
      const generated = generateApiKey('dev')
      findOne.mockResolvedValue(rowFor(generated.secret))

      await service.verify(generated.key)

      expect(clientKeyFindOne).not.toHaveBeenCalled()
    })

    it('refuses a live key whose firm has been revoked', async () => {
      const generated = generateApiKey('dev', ApiKeyKindEnum.PARTNER_CLIENT)
      clientKeyFindOne.mockResolvedValue(clientKeyRow(generated.secret))
      clientFindByPk.mockResolvedValue({ ...liveClient, revokedAt: new Date() })

      await expect(service.verify(generated.key)).rejects.toBeInstanceOf(
        UnauthorizedException,
      )
    })

    it('refuses a revoked key under a live firm', async () => {
      const generated = generateApiKey('dev', ApiKeyKindEnum.PARTNER_CLIENT)
      clientKeyFindOne.mockResolvedValue(
        clientKeyRow(generated.secret, { revokedAt: new Date() }),
      )
      clientFindByPk.mockResolvedValue(liveClient)

      await expect(service.verify(generated.key)).rejects.toBeInstanceOf(
        UnauthorizedException,
      )
    })

    it('refuses the wrong secret with the same message as every other failure', async () => {
      const generated = generateApiKey('dev', ApiKeyKindEnum.PARTNER_CLIENT)
      clientKeyFindOne.mockResolvedValue(clientKeyRow('some-other-secret'))
      clientFindByPk.mockResolvedValue(liveClient)

      await expect(service.verify(generated.key)).rejects.toThrow(
        'Invalid API key',
      )
    })

    it('refuses a doe_ key whose keyId exists only in the client table', async () => {
      // The prefix, not the keyId, decides the table: a company-prefixed key
      // cannot reach a client row by guessing its keyId.
      const generated = generateApiKey('dev')
      findOne.mockResolvedValue(null)
      clientKeyFindOne.mockResolvedValue(clientKeyRow(generated.secret))

      await expect(service.verify(generated.key)).rejects.toBeInstanceOf(
        UnauthorizedException,
      )
    })
  })
})
