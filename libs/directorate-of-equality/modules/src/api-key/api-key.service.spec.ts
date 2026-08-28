import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common'
import { getModelToken } from '@nestjs/sequelize'
import { Test } from '@nestjs/testing'

import {
  ApiKeyModel,
  ApiKeyOriginEnum,
  ApiKeyScopeEnum,
  DEFAULT_API_KEY_SCOPES,
  hashApiKeySecret,
  parseApiKey,
} from '@dmr.is/doe-shared'
import { LOGGER_PROVIDER } from '@dmr.is/logging'

import { CompanyStatusEnum } from '../company/models/company.enums'
import { ICompanyEventService } from '../company-event/company-event.service.interface'
import { ApiKeyService } from './api-key.service'
import { ApiKeyCompany } from './api-key.service.interface'

const PEPPER = 'spec-pepper-not-a-real-secret-but-long-enough'

const COMPANY: ApiKeyCompany = {
  id: '11111111-1111-1111-1111-111111111111',
  nationalId: '5501012130',
  status: CompanyStatusEnum.ACTIVE,
}

const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

describe('ApiKeyService', () => {
  let service: ApiKeyService
  let create: jest.Mock
  let findAll: jest.Mock
  let findOne: jest.Mock
  let count: jest.Mock
  let events: { emitApiKeyIssued: jest.Mock; emitApiKeyRevoked: jest.Mock }

  /** Stands in for a persisted row, echoing back what `create` was given. */
  const rowFrom = (attrs: Record<string, unknown>) => ({
    id: 'row-id',
    createdAt: new Date('2026-08-21T10:00:00.000Z'),
    revokedAt: null,
    ...attrs,
    fromModel: () => ({ id: 'row-id', ...attrs }),
  })

  beforeEach(async () => {
    jest.clearAllMocks()
    process.env.DOE_API_KEY_HMAC_SECRET = PEPPER
    process.env.API_ENV = 'prod'

    create = jest.fn().mockImplementation(async (attrs) => rowFrom(attrs))
    findAll = jest.fn().mockResolvedValue([])
    findOne = jest.fn().mockResolvedValue(null)
    count = jest.fn().mockResolvedValue(0)
    events = { emitApiKeyIssued: jest.fn(), emitApiKeyRevoked: jest.fn() }

    const module = await Test.createTestingModule({
      providers: [
        ApiKeyService,
        { provide: LOGGER_PROVIDER, useValue: mockLogger },
        {
          provide: getModelToken(ApiKeyModel),
          useValue: { create, findAll, findOne, count },
        },
        { provide: ICompanyEventService, useValue: events },
      ],
    }).compile()

    service = module.get(ApiKeyService)
  })

  afterEach(() => {
    delete process.env.DOE_API_KEY_HMAC_SECRET
    delete process.env.API_ENV
  })

  describe('issue', () => {
    it('returns a plaintext key that verifies against the stored hash', async () => {
      const issued = await service.issue({
        company: COMPANY,
        createdVia: ApiKeyOriginEnum.ISLAND_IS,
        actorNationalId: '0101901234',
      })

      const parsed = parseApiKey(issued.key)
      expect(parsed).not.toBeNull()

      const stored = create.mock.calls[0][0]
      expect(parsed?.keyId).toBe(stored.keyId)
      expect(hashApiKeySecret(parsed?.secret ?? '', PEPPER)).toBe(
        stored.secretHash,
      )
    })

    it('never persists the secret in any form but the hash', async () => {
      const issued = await service.issue({
        company: COMPANY,
        createdVia: ApiKeyOriginEnum.ISLAND_IS,
        actorNationalId: '0101901234',
      })

      const secret = parseApiKey(issued.key)?.secret ?? ''
      expect(JSON.stringify(create.mock.calls[0][0])).not.toContain(secret)
    })

    it('bakes the configured environment into the key', async () => {
      const issued = await service.issue({
        company: COMPANY,
        createdVia: ApiKeyOriginEnum.ISLAND_IS,
        actorNationalId: '0101901234',
      })

      expect(parseApiKey(issued.key)?.env).toBe('prod')
    })

    it('records the kennitala and no reviewer on the island.is path', async () => {
      await service.issue({
        company: COMPANY,
        createdVia: ApiKeyOriginEnum.ISLAND_IS,
        actorNationalId: '0101901234',
      })

      expect(create.mock.calls[0][0]).toMatchObject({
        createdVia: ApiKeyOriginEnum.ISLAND_IS,
        createdByNationalId: '0101901234',
        createdByUserId: null,
      })
    })

    it('records the reviewer and no kennitala on the admin path', async () => {
      await service.issue({
        company: COMPANY,
        createdVia: ApiKeyOriginEnum.ADMIN,
        actorUserId: 'reviewer-1',
      })

      expect(create.mock.calls[0][0]).toMatchObject({
        createdVia: ApiKeyOriginEnum.ADMIN,
        createdByUserId: 'reviewer-1',
        createdByNationalId: null,
      })
    })

    it('rejects an admin issuance with no reviewer, before it reaches the CHECK', async () => {
      await expect(
        service.issue({
          company: COMPANY,
          createdVia: ApiKeyOriginEnum.ADMIN,
        }),
      ).rejects.toBeInstanceOf(BadRequestException)

      expect(create).not.toHaveBeenCalled()
    })

    it('rejects a self-service issuance with no kennitala', async () => {
      await expect(
        service.issue({
          company: COMPANY,
          createdVia: ApiKeyOriginEnum.ISLAND_IS,
        }),
      ).rejects.toBeInstanceOf(BadRequestException)

      expect(create).not.toHaveBeenCalled()
    })

    it('ignores an actor that does not belong to the path taken', async () => {
      // An admin-path caller passing a kennitala must not get it stored — the
      // CHECK constraint would reject the row as a 500.
      await service.issue({
        company: COMPANY,
        createdVia: ApiKeyOriginEnum.ADMIN,
        actorUserId: 'reviewer-1',
        actorNationalId: '0101901234',
      })

      expect(create.mock.calls[0][0].createdByNationalId).toBeNull()
    })

    it('grants the full scope set when none is asked for', async () => {
      await service.issue({
        company: COMPANY,
        createdVia: ApiKeyOriginEnum.ISLAND_IS,
        actorNationalId: '0101901234',
      })

      expect(create.mock.calls[0][0].scopes).toEqual(DEFAULT_API_KEY_SCOPES)
    })

    it('honours a narrower scope set and de-duplicates it', async () => {
      await service.issue({
        company: COMPANY,
        createdVia: ApiKeyOriginEnum.ISLAND_IS,
        actorNationalId: '0101901234',
        scopes: [ApiKeyScopeEnum.SALARY_SUBMIT, ApiKeyScopeEnum.SALARY_SUBMIT],
      })

      expect(create.mock.calls[0][0].scopes).toEqual([
        ApiKeyScopeEnum.SALARY_SUBMIT,
      ])
    })

    it('rejects an unrecognised scope rather than storing it', async () => {
      // scopes is text[], so the database would accept anything and the key
      // would then fail every scope check at request time.
      await expect(
        service.issue({
          company: COMPANY,
          createdVia: ApiKeyOriginEnum.ISLAND_IS,
          actorNationalId: '0101901234',
          scopes: ['report:delete' as ApiKeyScopeEnum],
        }),
      ).rejects.toBeInstanceOf(BadRequestException)

      expect(create).not.toHaveBeenCalled()
    })

    it('emits an issuance event carrying the keyId', async () => {
      const issued = await service.issue({
        company: COMPANY,
        createdVia: ApiKeyOriginEnum.ADMIN,
        actorUserId: 'reviewer-1',
      })

      expect(events.emitApiKeyIssued).toHaveBeenCalledWith(
        COMPANY.id,
        CompanyStatusEnum.ACTIVE,
        issued.keyId,
        'reviewer-1',
      )
    })

    it('emits no reviewer on a self-service issuance', async () => {
      await service.issue({
        company: COMPANY,
        createdVia: ApiKeyOriginEnum.ISLAND_IS,
        actorNationalId: '0101901234',
      })

      expect(events.emitApiKeyIssued).toHaveBeenCalledWith(
        COMPANY.id,
        CompanyStatusEnum.ACTIVE,
        expect.any(String),
        null,
      )
    })

    it('refuses to issue with no pepper configured', async () => {
      delete process.env.DOE_API_KEY_HMAC_SECRET

      await expect(
        service.issue({
          company: COMPANY,
          createdVia: ApiKeyOriginEnum.ISLAND_IS,
          actorNationalId: '0101901234',
        }),
      ).rejects.toBeInstanceOf(InternalServerErrorException)
    })

    it('does not name the env var in what the caller receives', async () => {
      // HttpExceptionFilter genericises `message` but copies the exception's own
      // message into `details`, which IS returned — so naming the variable here
      // publishes a piece of our deployment configuration to anyone who can
      // provoke the 500. The detail goes to the log instead.
      delete process.env.DOE_API_KEY_HMAC_SECRET

      try {
        await service.issue({
          company: COMPANY,
          createdVia: ApiKeyOriginEnum.ISLAND_IS,
          actorNationalId: '0101901234',
        })
        throw new Error('expected issue() to throw')
      } catch (error) {
        const response = (error as InternalServerErrorException).getResponse?.()
        expect(JSON.stringify(response ?? {})).not.toContain(
          'DOE_API_KEY_HMAC_SECRET',
        )
      }

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('DOE_API_KEY_HMAC_SECRET'),
        expect.anything(),
      )
    })

    it('mints a distinct credential every time', async () => {
      const first = await service.issue({
        company: COMPANY,
        createdVia: ApiKeyOriginEnum.ISLAND_IS,
        actorNationalId: '0101901234',
      })
      const second = await service.issue({
        company: COMPANY,
        createdVia: ApiKeyOriginEnum.ISLAND_IS,
        actorNationalId: '0101901234',
      })

      expect(first.key).not.toBe(second.key)
      expect(first.keyId).not.toBe(second.keyId)
    })
  })

  describe('expiry', () => {
    it('accepts an expiry in the future', async () => {
      await expect(
        service.issue({
          company: COMPANY,
          createdVia: ApiKeyOriginEnum.ISLAND_IS,
          actorNationalId: '0101901234',
          expiresAt: new Date(Date.now() + 86_400_000),
        }),
      ).resolves.toBeDefined()
    })

    it('rejects an expiry already in the past', async () => {
      // Otherwise the caller gets 201 and a plaintext secret no verifier will
      // ever accept — a failure that looks exactly like success.
      await expect(
        service.issue({
          company: COMPANY,
          createdVia: ApiKeyOriginEnum.ISLAND_IS,
          actorNationalId: '0101901234',
          expiresAt: new Date(Date.now() - 1000),
        }),
      ).rejects.toBeInstanceOf(BadRequestException)

      expect(create).not.toHaveBeenCalled()
    })

    it('still treats no expiry as a valid choice', async () => {
      // "ótímabundinn" is offered in the admin UI; null must stay meaningful.
      await service.issue({
        company: COMPANY,
        createdVia: ApiKeyOriginEnum.ISLAND_IS,
        actorNationalId: '0101901234',
      })

      expect(create.mock.calls[0][0].expiresAt).toBeNull()
    })
  })

  describe('live key ceiling', () => {
    it('counts only usable keys — revoked and expired never block issuing', async () => {
      await service.issue({
        company: COMPANY,
        createdVia: ApiKeyOriginEnum.ISLAND_IS,
        actorNationalId: '0101901234',
      })

      const where = count.mock.calls[0][0].where

      expect(where.companyId).toBe(COMPANY.id)
      expect(where.revokedAt).toBeNull()
    })

    it('refuses to mint beyond the ceiling', async () => {
      // Nothing counted before this, so one principal could mint unbounded live
      // bearer credentials for its own tenant in a loop.
      count.mockResolvedValue(10)

      await expect(
        service.issue({
          company: COMPANY,
          createdVia: ApiKeyOriginEnum.ISLAND_IS,
          actorNationalId: '0101901234',
        }),
      ).rejects.toBeInstanceOf(BadRequestException)

      expect(create).not.toHaveBeenCalled()
    })

    it('allows issuing while below the ceiling, so rotation is never blocked', async () => {
      count.mockResolvedValue(9)

      await expect(
        service.issue({
          company: COMPANY,
          createdVia: ApiKeyOriginEnum.ISLAND_IS,
          actorNationalId: '0101901234',
        }),
      ).resolves.toBeDefined()
    })
  })

  describe('list', () => {
    it('scopes to the company and returns newest first', async () => {
      await service.list(COMPANY.id)

      expect(findAll).toHaveBeenCalledWith({
        where: { companyId: COMPANY.id },
        order: [['created_at', 'DESC']],
      })
    })

    it('maps through fromModel, which carries no secret', async () => {
      findAll.mockResolvedValue([
        { fromModel: () => ({ id: 'a', keyId: 'k1' }) },
        { fromModel: () => ({ id: 'b', keyId: 'k2' }) },
      ])

      const listed = await service.list(COMPANY.id)

      expect(listed).toEqual([
        { id: 'a', keyId: 'k1' },
        { id: 'b', keyId: 'k2' },
      ])
      for (const key of listed) {
        expect(key).not.toHaveProperty('key')
        expect(key).not.toHaveProperty('secretHash')
      }
    })
  })

  describe('revoke', () => {
    type RevocableRow = {
      id: string
      keyId: string
      revokedAt: Date | null
      revokedByUserId: string | null
      revokedByNationalId: string | null
      revokedReason: string | null
      update: jest.Mock
      fromModel: () => { id: string; keyId: string }
    }

    const liveKey = (overrides: Partial<RevocableRow> = {}): RevocableRow => {
      const row: RevocableRow = {
        id: 'key-row-1',
        keyId: 'aaaaaaaaaaaaaaa1',
        revokedAt: null,
        revokedByUserId: null,
        revokedByNationalId: null,
        revokedReason: null,
        update: jest.fn(),
        fromModel: () => ({ id: 'key-row-1', keyId: 'aaaaaaaaaaaaaaa1' }),
        ...overrides,
      }
      // Assigned after construction so the mock can close over `row` and mutate
      // it the way Sequelize's instance.update does.
      row.update = jest.fn().mockImplementation(async (attrs) => {
        Object.assign(row, attrs)
        return row
      })
      return row
    }

    it('stamps the revocation and emits the event', async () => {
      const row = liveKey()
      findOne.mockResolvedValue(row)

      await service.revoke({
        id: 'key-row-1',
        company: COMPANY,
        actorUserId: 'reviewer-1',
        reason: 'rotated',
      })

      expect(row.update).toHaveBeenCalledWith({
        revokedAt: expect.any(Date),
        revokedByUserId: 'reviewer-1',
        revokedByNationalId: null,
        revokedReason: 'rotated',
      })
      expect(events.emitApiKeyRevoked).toHaveBeenCalledWith(
        COMPANY.id,
        CompanyStatusEnum.ACTIVE,
        'aaaaaaaaaaaaaaa1',
        'reviewer-1',
        'rotated',
      )
    })

    it('scopes the lookup to the company so one tenant cannot revoke another', async () => {
      findOne.mockResolvedValue(liveKey())

      await service.revoke({ id: 'key-row-1', company: COMPANY })

      expect(findOne).toHaveBeenCalledWith({
        where: { id: 'key-row-1', companyId: COMPANY.id },
      })
    })

    it('404s a key that is missing or belongs to another company', async () => {
      findOne.mockResolvedValue(null)

      await expect(
        service.revoke({ id: 'someone-elses-key', company: COMPANY }),
      ).rejects.toBeInstanceOf(NotFoundException)
    })

    it('leaves an existing revocation intact rather than overwriting the audit trail', async () => {
      const row = liveKey({
        revokedAt: new Date('2026-01-01T00:00:00.000Z'),
        revokedByUserId: 'original-reviewer',
      })
      findOne.mockResolvedValue(row)

      await service.revoke({
        id: 'key-row-1',
        company: COMPANY,
        actorUserId: 'later-reviewer',
      })

      expect(row.update).not.toHaveBeenCalled()
      expect(events.emitApiKeyRevoked).not.toHaveBeenCalled()
      expect(row.revokedByUserId).toBe('original-reviewer')
    })
  })
})
