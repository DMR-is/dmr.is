import { UniqueConstraintError } from 'sequelize'

import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common'

import { ApiKeyScopeEnum } from '@dmr.is/doe-shared'

import { CompanyStatusEnum } from '../company/models/company.enums'
import { PartnerDelegationService } from './partner-delegation.service'
import { DelegatingCompany } from './partner-delegation.service.interface'

const logger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

/** Placeholder kennitölur — shape only, never checksum-valid. */
const COMPANY: DelegatingCompany = {
  id: 'company-x',
  nationalId: '1111111111',
  status: CompanyStatusEnum.ACTIVE,
}

const FIRM = {
  id: 'client-a',
  name: 'Kjarni',
  nationalId: '9999999999',
  scopes: [
    ApiKeyScopeEnum.REPORT_READ,
    ApiKeyScopeEnum.SALARY_SUBMIT,
    ApiKeyScopeEnum.SCORING_WRITE,
  ],
  revokedAt: null as Date | null,
}

const delegationRow = (overrides: Record<string, unknown> = {}) => {
  const row: Record<string, unknown> = {
    id: 'd-1',
    partnerClientId: FIRM.id,
    companyId: COMPANY.id,
    companyNationalId: COMPANY.nationalId,
    scopes: [ApiKeyScopeEnum.REPORT_READ],
    grantedByNationalId: '0000000000',
    createdAt: new Date('2026-09-23T10:00:00.000Z'),
    revokedAt: null,
    ...overrides,
  }
  row.update = jest.fn().mockImplementation(async (changes) => {
    Object.assign(row, changes)
    return row
  })
  row.reload = jest.fn().mockResolvedValue(row)
  return row
}

describe('PartnerDelegationService', () => {
  let delegations: {
    findOne: jest.Mock
    findAll: jest.Mock
    create: jest.Mock
    update: jest.Mock
  }
  let clients: { findByPk: jest.Mock; findAll: jest.Mock }
  let companies: { findAll: jest.Mock }
  let events: {
    emitPartnerDelegationGranted: jest.Mock
    emitPartnerDelegationRevoked: jest.Mock
  }
  let service: PartnerDelegationService

  beforeEach(() => {
    jest.clearAllMocks()
    delegations = {
      findOne: jest.fn().mockResolvedValue(null),
      findAll: jest.fn().mockResolvedValue([]),
      create: jest
        .fn()
        .mockImplementation(async (attrs) => delegationRow(attrs)),
      update: jest.fn().mockResolvedValue([1]),
    }
    clients = {
      findByPk: jest.fn().mockResolvedValue({ ...FIRM }),
      findAll: jest.fn().mockResolvedValue([{ ...FIRM }]),
    }
    companies = { findAll: jest.fn().mockResolvedValue([]) }
    events = {
      emitPartnerDelegationGranted: jest.fn(),
      emitPartnerDelegationRevoked: jest.fn(),
    }
    service = new PartnerDelegationService(
      logger as never,
      delegations as never,
      clients as never,
      companies as never,
      events as never,
    )
  })

  /**
   * The one lookup the guard and the self-service web both use. It must only
   * ever answer with a live row: a withdrawn delegation that still resolved
   * would let a firm keep filing after the company said no.
   */
  it('looks up the live delegation only', async () => {
    await service.findLive(FIRM.id, COMPANY.nationalId)

    expect(delegations.findOne).toHaveBeenCalledWith({
      where: {
        partnerClientId: FIRM.id,
        companyNationalId: COMPANY.nationalId,
        revokedAt: null,
      },
    })
  })

  describe('listLiveForClient', () => {
    it('lists a firm’s live delegations, newest first, with company names', async () => {
      const row = delegationRow()
      delegations.findAll.mockResolvedValue([row])
      companies.findAll.mockResolvedValue([{ id: COMPANY.id, name: 'X ehf.' }])

      await expect(service.listLiveForClient(FIRM.id)).resolves.toEqual([
        {
          id: 'd-1',
          companyNationalId: COMPANY.nationalId,
          companyName: 'X ehf.',
          scopes: [ApiKeyScopeEnum.REPORT_READ],
          grantedAt: row.createdAt,
        },
      ])
      expect(delegations.findAll).toHaveBeenCalledWith({
        where: { partnerClientId: FIRM.id, revokedAt: null },
        order: [['created_at', 'DESC']],
      })
    })

    it('does not query companies for a firm with no delegations', async () => {
      await expect(service.listLiveForClient(FIRM.id)).resolves.toEqual([])
      expect(companies.findAll).not.toHaveBeenCalled()
    })
  })

  describe('listLiveForCompany', () => {
    it('lists the company’s live delegations with the provider named', async () => {
      delegations.findAll.mockResolvedValue([delegationRow()])

      const [listed] = await service.listLiveForCompany(COMPANY.id)

      expect(delegations.findAll).toHaveBeenCalledWith({
        where: { companyId: COMPANY.id, revokedAt: null },
        order: [['created_at', 'DESC']],
      })
      expect(listed.provider).toEqual({
        id: FIRM.id,
        name: FIRM.name,
        nationalId: FIRM.nationalId,
        scopes: FIRM.scopes,
      })
    })
  })

  it('leaves out delegations to a firm that has since been revoked', async () => {
    delegations.findAll.mockResolvedValue([delegationRow()])
    clients.findAll.mockResolvedValue([])

    await expect(service.listLiveForCompany(COMPANY.id)).resolves.toEqual([])
    expect(clients.findAll).toHaveBeenCalledWith({
      where: { id: [FIRM.id], revokedAt: null },
    })
  })

  describe('grant', () => {
    const grant = (overrides: Record<string, unknown> = {}) =>
      service.grant({
        company: COMPANY,
        partnerClientId: FIRM.id,
        scopes: [ApiKeyScopeEnum.REPORT_READ, ApiKeyScopeEnum.SALARY_SUBMIT],
        actorNationalId: '0000000000',
        ...overrides,
      })

    it('records who granted what, for the signed-in company', async () => {
      await grant()

      expect(delegations.create).toHaveBeenCalledWith({
        partnerClientId: FIRM.id,
        companyId: COMPANY.id,
        companyNationalId: COMPANY.nationalId,
        scopes: [ApiKeyScopeEnum.REPORT_READ, ApiKeyScopeEnum.SALARY_SUBMIT],
        grantedByNationalId: '0000000000',
      })
    })

    it('puts the grant on the company’s timeline, naming the firm', async () => {
      await grant()

      expect(events.emitPartnerDelegationGranted).toHaveBeenCalledWith(
        COMPANY.id,
        COMPANY.status,
        `${FIRM.name} (${FIRM.nationalId})`,
      )
    })

    it('refuses a scope the firm was not approved for', async () => {
      clients.findByPk.mockResolvedValue({
        ...FIRM,
        scopes: [ApiKeyScopeEnum.REPORT_READ],
      })

      await expect(
        grant({ scopes: [ApiKeyScopeEnum.SCORING_WRITE] }),
      ).rejects.toBeInstanceOf(BadRequestException)
      expect(delegations.create).not.toHaveBeenCalled()
    })

    it('refuses an empty grant', async () => {
      await expect(grant({ scopes: [] })).rejects.toBeInstanceOf(
        BadRequestException,
      )
    })

    it('answers a revoked firm as though it did not exist', async () => {
      clients.findByPk.mockResolvedValue({ ...FIRM, revokedAt: new Date() })

      await expect(grant()).rejects.toBeInstanceOf(NotFoundException)
      expect(delegations.create).not.toHaveBeenCalled()
    })

    it('refuses a second live delegation to the same firm', async () => {
      delegations.findOne.mockResolvedValue(delegationRow())

      await expect(grant()).rejects.toBeInstanceOf(ConflictException)
      expect(delegations.create).not.toHaveBeenCalled()
    })

    it('answers the two-tabs race with the same 409, not a 500', async () => {
      delegations.create.mockRejectedValue(new UniqueConstraintError({}))

      await expect(grant()).rejects.toBeInstanceOf(ConflictException)
    })
  })

  describe('revoke', () => {
    it('scopes the lookup to the company, so one company cannot withdraw another’s', async () => {
      await service
        .revoke({ id: 'd-1', company: COMPANY })
        .catch(() => undefined)

      expect(delegations.findOne).toHaveBeenCalledWith({
        where: { id: 'd-1', companyId: COMPANY.id },
      })
    })

    it('404s a delegation that is missing or belongs to another company', async () => {
      await expect(
        service.revoke({ id: 'd-1', company: COMPANY }),
      ).rejects.toBeInstanceOf(NotFoundException)
    })

    it('stamps who withdrew it and records the event', async () => {
      const row = delegationRow()
      delegations.findOne.mockResolvedValue(row)

      await service.revoke({
        id: 'd-1',
        company: COMPANY,
        actorNationalId: '0000000000',
      })

      expect(delegations.update).toHaveBeenCalledWith(
        {
          revokedAt: expect.any(Date),
          revokedByNationalId: '0000000000',
          revokedByUserId: null,
        },
        { where: { id: 'd-1', revokedAt: null } },
      )
      expect(events.emitPartnerDelegationRevoked).toHaveBeenCalled()
    })

    it('writes one timeline event for a double-clicked withdraw', async () => {
      // Both requests read a live row; the second update matches nothing.
      delegations.findOne.mockResolvedValue(delegationRow())
      delegations.update.mockResolvedValueOnce([1]).mockResolvedValueOnce([0])

      await service.revoke({ id: 'd-1', company: COMPANY })
      await service.revoke({ id: 'd-1', company: COMPANY })

      expect(events.emitPartnerDelegationRevoked).toHaveBeenCalledTimes(1)
    })

    it('leaves an existing withdrawal intact', async () => {
      const row = delegationRow({ revokedAt: new Date('2026-09-01') })
      delegations.findOne.mockResolvedValue(row)

      await service.revoke({ id: 'd-1', company: COMPANY })

      expect(delegations.update).not.toHaveBeenCalled()
      expect(events.emitPartnerDelegationRevoked).not.toHaveBeenCalled()
    })
  })
})
