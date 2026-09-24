import { isValid as isValidKennitala } from 'kennitala'
import { UniqueConstraintError } from 'sequelize'

import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common'
import { getModelToken } from '@nestjs/sequelize'
import { Test } from '@nestjs/testing'

import {
  ApiKeyKindEnum,
  ApiKeyOriginEnum,
  ApiKeyScopeEnum,
  DEFAULT_API_KEY_SCOPES,
  hashApiKeySecret,
  parseApiKey,
} from '@dmr.is/doe-shared'
import { LOGGER_PROVIDER } from '@dmr.is/logging'

import { PartnerClientModel } from './models/partner-client.model'
import { PartnerClientKeyModel } from './models/partner-client-key.model'
import { PartnerClientService } from './partner-client.service'

const PEPPER = 'spec-pepper-not-a-real-secret-but-long-enough'
const ADMIN_ID = '22222222-2222-2222-2222-222222222222'
const CLIENT_ID = '33333333-3333-3333-3333-333333333333'

/**
 * A checksum-valid kennitala, computed rather than written out so the source
 * carries no real-looking ID (`disallow-kennitalas`).
 */
const validKennitala = (first8: string): string => {
  const weights = [3, 2, 7, 6, 5, 4, 3, 2]
  const sum = weights.reduce(
    (acc, weight, index) => acc + weight * Number(first8[index]),
    0,
  )
  const check = (11 - (sum % 11)) % 11
  if (check === 10) {
    throw new Error(`no valid check digit for ${first8}`)
  }
  return `${first8}${check}0`
}

const FIRM_NATIONAL_ID = validKennitala('55010121')

const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

/** Stands in for a persisted row, echoing back what it was built from. */
const rowFrom = (attrs: Record<string, unknown>) => {
  const row: Record<string, unknown> = {
    id: 'row-id',
    createdAt: new Date('2026-09-23T10:00:00.000Z'),
    revokedAt: null,
    ...attrs,
  }
  row.update = jest.fn().mockImplementation(async (changes) => {
    Object.assign(row, changes)
    return row
  })
  row.reload = jest.fn().mockResolvedValue(row)
  row.fromModel = () => ({ ...row })
  return row
}

describe('PartnerClientService', () => {
  let service: PartnerClientService
  let clients: {
    create: jest.Mock
    findAll: jest.Mock
    findOne: jest.Mock
    findByPk: jest.Mock
    update: jest.Mock
  }
  let keys: {
    create: jest.Mock
    findAll: jest.Mock
    findOne: jest.Mock
    count: jest.Mock
    update: jest.Mock
  }

  beforeEach(async () => {
    jest.clearAllMocks()
    process.env.DOE_API_KEY_HMAC_SECRET = PEPPER
    process.env.API_ENV = 'prod'

    clients = {
      create: jest.fn().mockImplementation(async (attrs) => rowFrom(attrs)),
      findAll: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
      findByPk: jest
        .fn()
        .mockResolvedValue(rowFrom({ id: CLIENT_ID, name: 'Kjarni' })),
      update: jest.fn().mockResolvedValue([1]),
    }
    keys = {
      create: jest.fn().mockImplementation(async (attrs) => rowFrom(attrs)),
      findAll: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
      count: jest.fn().mockResolvedValue(0),
      update: jest.fn().mockResolvedValue([1]),
    }

    const module = await Test.createTestingModule({
      providers: [
        PartnerClientService,
        { provide: LOGGER_PROVIDER, useValue: mockLogger },
        { provide: getModelToken(PartnerClientModel), useValue: clients },
        { provide: getModelToken(PartnerClientKeyModel), useValue: keys },
      ],
    }).compile()

    service = module.get(PartnerClientService)
  })

  afterEach(() => {
    delete process.env.DOE_API_KEY_HMAC_SECRET
    delete process.env.API_ENV
  })

  it('computes a kennitala the validator accepts, so the create tests test create', () => {
    expect(isValidKennitala(FIRM_NATIONAL_ID)).toBe(true)
  })

  describe('create', () => {
    const create = (overrides: Record<string, unknown> = {}) =>
      service.create({
        nationalId: FIRM_NATIONAL_ID,
        name: 'Kjarni',
        actorUserId: ADMIN_ID,
        ...overrides,
      })

    it('records the approving admin', async () => {
      await create()

      expect(clients.create).toHaveBeenCalledWith(
        expect.objectContaining({
          nationalId: FIRM_NATIONAL_ID,
          name: 'Kjarni',
          createdByUserId: ADMIN_ID,
        }),
      )
    })

    it('grants the default set — without scoring:write — when none is asked for', async () => {
      await create()

      const { scopes } = clients.create.mock.calls[0][0]
      expect(scopes).toEqual(DEFAULT_API_KEY_SCOPES)
      expect(scopes).not.toContain(ApiKeyScopeEnum.SCORING_WRITE)
    })

    it('grants scoring:write only when it is named', async () => {
      await create({
        scopes: [ApiKeyScopeEnum.REPORT_READ, ApiKeyScopeEnum.SCORING_WRITE],
      })

      expect(clients.create.mock.calls[0][0].scopes).toEqual([
        ApiKeyScopeEnum.REPORT_READ,
        ApiKeyScopeEnum.SCORING_WRITE,
      ])
    })

    it('rejects an unrecognised scope rather than storing it', async () => {
      await expect(
        create({ scopes: ['reports:everything'] }),
      ).rejects.toBeInstanceOf(BadRequestException)
      expect(clients.create).not.toHaveBeenCalled()
    })

    it('rejects a kennitala that fails its checksum', async () => {
      await expect(create({ nationalId: '0000000000' })).rejects.toBeInstanceOf(
        BadRequestException,
      )
      expect(clients.create).not.toHaveBeenCalled()
    })

    it('rejects a blank name', async () => {
      await expect(create({ name: '   ' })).rejects.toBeInstanceOf(
        BadRequestException,
      )
    })

    it('gives the admin UI an Icelandic reason to show', async () => {
      clients.findOne.mockResolvedValue(rowFrom({ id: CLIENT_ID }))

      const error = await create().catch((e) => e)

      expect(error.getResponse()).toMatchObject({
        translatedMessage: expect.stringContaining('þjónustuaðili'),
      })
    })

    it('refuses a second live client for the same firm', async () => {
      clients.findOne.mockResolvedValue(rowFrom({ id: CLIENT_ID }))

      await expect(create()).rejects.toBeInstanceOf(ConflictException)
      expect(clients.findOne).toHaveBeenCalledWith({
        where: { nationalId: FIRM_NATIONAL_ID, revokedAt: null },
      })
      expect(clients.create).not.toHaveBeenCalled()
    })

    it('answers the concurrent-approval race with the same 409, not a 500', async () => {
      clients.create.mockRejectedValue(new UniqueConstraintError({}))

      await expect(create()).rejects.toBeInstanceOf(ConflictException)
    })
  })

  describe('get', () => {
    it('404s an unknown client', async () => {
      clients.findByPk.mockResolvedValue(null)

      await expect(service.get(CLIENT_ID)).rejects.toBeInstanceOf(
        NotFoundException,
      )
    })
  })

  describe('listProviders', () => {
    /**
     * What a company chooses from. Only live firms, so a revoked one can never
     * be picked, and only this table, so no link can add one.
     */
    it('offers active firms only, by name, with their kennitala', async () => {
      clients.findAll.mockResolvedValue([
        rowFrom({
          id: CLIENT_ID,
          name: 'Kjarni',
          nationalId: FIRM_NATIONAL_ID,
          scopes: [ApiKeyScopeEnum.REPORT_READ, ApiKeyScopeEnum.SALARY_SUBMIT],
        }),
      ])

      await expect(service.listProviders()).resolves.toEqual([
        {
          id: CLIENT_ID,
          name: 'Kjarni',
          nationalId: FIRM_NATIONAL_ID,
          scopes: [ApiKeyScopeEnum.REPORT_READ, ApiKeyScopeEnum.SALARY_SUBMIT],
        },
      ])
      expect(clients.findAll).toHaveBeenCalledWith({
        where: { revokedAt: null },
        order: [['name', 'ASC']],
      })
    })
  })

  describe('findLiveByNationalId', () => {
    it('recognises a firm by its live row only', async () => {
      await expect(
        service.findLiveByNationalId(FIRM_NATIONAL_ID),
      ).resolves.toBeNull()
      expect(clients.findOne).toHaveBeenCalledWith({
        where: { nationalId: FIRM_NATIONAL_ID, revokedAt: null },
      })
    })
  })

  describe('revoke', () => {
    it('stamps the revocation and its actor', async () => {
      const client = rowFrom({ id: CLIENT_ID })
      clients.findByPk.mockResolvedValue(client)

      await service.revoke({ id: CLIENT_ID, actorUserId: ADMIN_ID })

      expect(clients.update).toHaveBeenCalledWith(
        expect.objectContaining({
          revokedAt: expect.any(Date),
          revokedByUserId: ADMIN_ID,
        }),
        { where: { id: CLIENT_ID, revokedAt: null } },
      )
    })

    /**
     * Two admins revoking at once both read a live row. The update is
     * conditional on the row still being live, so the one that loses writes
     * nothing and answers with the winner's revocation.
     */
    it('lets the first of two concurrent revocations stand', async () => {
      const first = new Date('2026-09-23T10:00:00.000Z')
      clients.findByPk
        .mockResolvedValueOnce(rowFrom({ id: CLIENT_ID }))
        .mockResolvedValueOnce(
          rowFrom({
            id: CLIENT_ID,
            revokedAt: first,
            revokedByUserId: 'other',
          }),
        )
      clients.update.mockResolvedValue([0])

      const result = await service.revoke({
        id: CLIENT_ID,
        actorUserId: ADMIN_ID,
      })

      expect(result).toMatchObject({
        revokedAt: first,
        revokedByUserId: 'other',
      })
    })

    it('leaves an existing revocation intact rather than overwriting the audit trail', async () => {
      const client = rowFrom({
        id: CLIENT_ID,
        revokedAt: new Date('2026-09-01T00:00:00.000Z'),
      })
      clients.findByPk.mockResolvedValue(client)

      await service.revoke({ id: CLIENT_ID, actorUserId: ADMIN_ID })

      expect(clients.update).not.toHaveBeenCalled()
    })
  })

  describe('issueKey', () => {
    const issue = (overrides: Record<string, unknown> = {}) =>
      service.issueKey({
        partnerClientId: CLIENT_ID,
        createdVia: ApiKeyOriginEnum.ADMIN,
        actorUserId: ADMIN_ID,
        ...overrides,
      })

    it('mints a vendor-kind key, so the partner API routes it to the client table', async () => {
      const issued = await issue()

      expect(issued.key.startsWith('doev_prod_')).toBe(true)
      expect(parseApiKey(issued.key)?.kind).toBe(ApiKeyKindEnum.PARTNER_CLIENT)
    })

    it('returns a plaintext key that verifies against the stored hash', async () => {
      const issued = await issue()

      const parsed = parseApiKey(issued.key)
      const stored = keys.create.mock.calls[0][0]
      expect(parsed?.keyId).toBe(stored.keyId)
      expect(hashApiKeySecret(parsed?.secret ?? '', PEPPER)).toBe(
        stored.secretHash,
      )
    })

    it('never persists the secret in any form but the hash', async () => {
      const issued = await issue()

      const secret = parseApiKey(issued.key)?.secret ?? ''
      expect(JSON.stringify(keys.create.mock.calls[0][0])).not.toContain(secret)
    })

    it('records the reviewer on the admin path and the kennitala on the self-service one', async () => {
      await issue()
      await issue({
        createdVia: ApiKeyOriginEnum.ISLAND_IS,
        actorUserId: undefined,
        actorNationalId: FIRM_NATIONAL_ID,
      })

      expect(keys.create.mock.calls[0][0]).toMatchObject({
        createdByUserId: ADMIN_ID,
        createdByNationalId: null,
      })
      expect(keys.create.mock.calls[1][0]).toMatchObject({
        createdByUserId: null,
        createdByNationalId: FIRM_NATIONAL_ID,
      })
    })

    it('rejects an admin issuance with no reviewer, before it reaches the CHECK', async () => {
      await expect(issue({ actorUserId: undefined })).rejects.toBeInstanceOf(
        BadRequestException,
      )
      expect(keys.create).not.toHaveBeenCalled()
    })

    it('rejects an expiry already in the past', async () => {
      await expect(
        issue({ expiresAt: new Date(Date.now() - 1000) }),
      ).rejects.toBeInstanceOf(BadRequestException)
    })

    it('refuses to mint for a revoked firm', async () => {
      clients.findByPk.mockResolvedValue(
        rowFrom({ id: CLIENT_ID, revokedAt: new Date() }),
      )

      await expect(issue()).rejects.toBeInstanceOf(ConflictException)
      expect(keys.create).not.toHaveBeenCalled()
    })

    it('404s an unknown firm', async () => {
      clients.findByPk.mockResolvedValue(null)

      await expect(issue()).rejects.toBeInstanceOf(NotFoundException)
    })

    it('refuses to mint beyond the live-key ceiling', async () => {
      keys.count.mockResolvedValue(10)

      await expect(issue()).rejects.toBeInstanceOf(BadRequestException)
      expect(keys.create).not.toHaveBeenCalled()
    })

    it('refuses to issue with no pepper configured, without naming the variable', async () => {
      delete process.env.DOE_API_KEY_HMAC_SECRET

      const error = await issue().catch((e) => e)

      expect(error).toBeInstanceOf(InternalServerErrorException)
      expect(JSON.stringify(error.getResponse())).not.toContain(
        'DOE_API_KEY_HMAC_SECRET',
      )
    })
  })

  describe('listKeys', () => {
    it('404s an unknown firm rather than answering an empty list', async () => {
      clients.findByPk.mockResolvedValue(null)

      await expect(service.listKeys(CLIENT_ID)).rejects.toBeInstanceOf(
        NotFoundException,
      )
    })

    it('scopes to the firm and returns newest first', async () => {
      await service.listKeys(CLIENT_ID)

      expect(keys.findAll).toHaveBeenCalledWith({
        where: { partnerClientId: CLIENT_ID },
        order: [['created_at', 'DESC']],
      })
    })
  })

  describe('revokeKey', () => {
    it('scopes the lookup to the firm, so one firm cannot revoke another’s key', async () => {
      await service
        .revokeKey({ id: 'key-row', partnerClientId: CLIENT_ID })
        .catch(() => undefined)

      expect(keys.findOne).toHaveBeenCalledWith({
        where: { id: 'key-row', partnerClientId: CLIENT_ID },
      })
    })

    it('404s a key that is missing or belongs to another firm', async () => {
      await expect(
        service.revokeKey({ id: 'key-row', partnerClientId: CLIENT_ID }),
      ).rejects.toBeInstanceOf(NotFoundException)
    })

    it('lets the first of two concurrent key revocations stand', async () => {
      const first = new Date('2026-09-23T10:00:00.000Z')
      const row = rowFrom({ id: 'key-row', keyId: 'aaaaaaaaaaaaaaa1' })
      // Read live, then lose the race: the conditional update matches nothing
      // and the reloaded row carries the winner's revocation.
      row.reload = jest.fn().mockImplementation(async () => {
        Object.assign(row, { revokedAt: first, revokedByUserId: 'other' })
        return row
      })
      keys.findOne.mockResolvedValueOnce(row)
      keys.update.mockResolvedValueOnce([0])

      const result = await service.revokeKey({
        id: 'key-row',
        partnerClientId: CLIENT_ID,
        actorUserId: ADMIN_ID,
      })

      expect(result).toMatchObject({
        revokedAt: first,
        revokedByUserId: 'other',
      })
    })

    it('stamps the revocation, and leaves an existing one intact', async () => {
      const live = rowFrom({ id: 'key-row', keyId: 'aaaaaaaaaaaaaaa1' })
      keys.findOne.mockResolvedValueOnce(live)

      await service.revokeKey({
        id: 'key-row',
        partnerClientId: CLIENT_ID,
        actorUserId: ADMIN_ID,
      })

      expect(keys.update).toHaveBeenCalledWith(
        expect.objectContaining({
          revokedAt: expect.any(Date),
          revokedByUserId: ADMIN_ID,
        }),
        { where: { id: 'key-row', revokedAt: null } },
      )

      const revoked = rowFrom({ id: 'key-row', revokedAt: new Date() })
      keys.findOne.mockResolvedValueOnce(revoked)

      keys.update.mockClear()
      await service.revokeKey({ id: 'key-row', partnerClientId: CLIENT_ID })

      expect(keys.update).not.toHaveBeenCalled()
    })
  })
})
