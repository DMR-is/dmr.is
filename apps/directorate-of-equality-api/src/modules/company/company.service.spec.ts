import { NotFoundException } from '@nestjs/common'
import { getModelToken } from '@nestjs/sequelize'
import { Test } from '@nestjs/testing'

import {
  INationalRegistryService,
  NationalRegistryEntityDto,
} from '@dmr.is/clients-national-registry'
import { LOGGER_PROVIDER } from '@dmr.is/logging'

import { ICompanyCommentService } from '../company-comment/company-comment.service.interface'
import { ICompanyEventService } from '../company-event/company-event.service.interface'
import { CompanyTimelineItemKindEnum } from './dto/company-timeline-item.dto'
import { CompanySizeEnum, CompanyStatusEnum } from './models/company.enums'
import { CompanyModel } from './models/company.model'
import { CompanyService } from './company.service'

const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

describe('CompanyService', () => {
  let service: CompanyService
  let findOneOrThrow: jest.Mock
  let findOne: jest.Mock
  let create: jest.Mock
  let getEntityByNationalId: jest.Mock
  let emitCreated: jest.Mock
  let emitStatusChanged: jest.Mock
  let eventsByCompanyId: jest.Mock
  let commentsByCompanyId: jest.Mock

  beforeEach(async () => {
    findOneOrThrow = jest.fn()
    findOne = jest.fn()
    create = jest.fn()
    getEntityByNationalId = jest.fn()
    emitCreated = jest.fn()
    emitStatusChanged = jest.fn()
    eventsByCompanyId = jest.fn().mockResolvedValue([])
    commentsByCompanyId = jest.fn().mockResolvedValue([])

    const module = await Test.createTestingModule({
      providers: [
        CompanyService,
        { provide: LOGGER_PROVIDER, useValue: mockLogger },
        {
          provide: INationalRegistryService,
          useValue: { getEntityByNationalId },
        },
        {
          provide: getModelToken(CompanyModel),
          useValue: { findOneOrThrow, findOne, create },
        },
        {
          provide: ICompanyEventService,
          useValue: {
            emitCreated,
            emitStatusChanged,
            getByCompanyId: eventsByCompanyId,
          },
        },
        {
          provide: ICompanyCommentService,
          useValue: { getByCompanyId: commentsByCompanyId },
        },
      ],
    }).compile()

    service = module.get(CompanyService)
  })

  it('returns the company DTO when one is found by national id', async () => {
    findOneOrThrow.mockResolvedValue({
      fromModel: () => ({
        id: 'company-1',
        name: 'Acme ehf.',
        nationalId: '5501234567',
      }),
    })

    const result = await service.getByNationalId('5501234567')

    expect(findOneOrThrow).toHaveBeenCalledWith(
      { where: { nationalId: '5501234567' } },
      'Company with national id "5501234567" not found',
    )
    expect(result).toEqual({
      id: 'company-1',
      name: 'Acme ehf.',
      nationalId: '5501234567',
    })
  })

  it('throws NotFoundException when no company matches the national id', async () => {
    findOneOrThrow.mockRejectedValue(new NotFoundException())

    await expect(service.getByNationalId('0000000000')).rejects.toThrow(
      NotFoundException,
    )
  })

  describe('getOrCreateByNationalId', () => {
    it('returns the existing company without touching the registry or creating a row', async () => {
      findOne.mockResolvedValue(
        makeCompanyModel({
          id: 'company-1',
          name: 'Acme ehf.',
          nationalId: '5501234567',
          employeeCountCategory: CompanySizeEnum.SMALL,
        }),
      )

      const result = await service.getOrCreateByNationalId('5501234567')

      expect(findOne).toHaveBeenCalledWith({
        where: { nationalId: '5501234567' },
      })
      expect(getEntityByNationalId).not.toHaveBeenCalled()
      expect(create).not.toHaveBeenCalled()
      expect(result).toEqual({
        id: 'company-1',
        name: 'Acme ehf.',
        nationalId: '5501234567',
        employeeCountCategory: CompanySizeEnum.SMALL,
      })
    })

    it('creates a new company with the registry name and unknown employee count category when missing', async () => {
      findOne.mockResolvedValue(null)
      getEntityByNationalId.mockResolvedValue({
        entity: makeRegistryEntity({
          kennitala: '6601234567',
          nafn: 'Registry Name ehf.',
        }),
      })
      create.mockResolvedValue(
        makeCompanyModel({
          id: 'company-2',
          name: 'Registry Name ehf.',
          nationalId: '6601234567',
          employeeCountCategory: CompanySizeEnum.UNKNOWN,
        }),
      )

      const result = await service.getOrCreateByNationalId(
        '6601234567',
        'Body-provided name',
      )

      expect(create).toHaveBeenCalledWith({
        name: 'Registry Name ehf.',
        nationalId: '6601234567',
        employeeCountCategory: CompanySizeEnum.UNKNOWN,
      })
      expect(result).toEqual({
        id: 'company-2',
        name: 'Registry Name ehf.',
        nationalId: '6601234567',
        employeeCountCategory: CompanySizeEnum.UNKNOWN,
      })
    })

    it('falls back to the supplied name when the registry has no matching entity', async () => {
      findOne.mockResolvedValue(null)
      getEntityByNationalId.mockResolvedValue({ entity: null })
      create.mockResolvedValue(
        makeCompanyModel({
          id: 'company-3',
          name: 'Body-provided name',
          nationalId: '7701234567',
          employeeCountCategory: CompanySizeEnum.UNKNOWN,
        }),
      )

      const result = await service.getOrCreateByNationalId(
        '7701234567',
        'Body-provided name',
      )

      expect(create).toHaveBeenCalledWith({
        name: 'Body-provided name',
        nationalId: '7701234567',
        employeeCountCategory: CompanySizeEnum.UNKNOWN,
      })
      expect(result.name).toBe('Body-provided name')
    })

    it('throws NotFoundException when neither the registry nor a fallback name yield a name', async () => {
      findOne.mockResolvedValue(null)
      getEntityByNationalId.mockResolvedValue({ entity: null })

      await expect(
        service.getOrCreateByNationalId('8801234567'),
      ).rejects.toThrow(NotFoundException)

      expect(create).not.toHaveBeenCalled()
    })
  })

  describe('getOrCreateSubsidiaryReportSnapshotSource', () => {
    it('returns existing company data with address fields seeded from the national registry', async () => {
      getEntityByNationalId.mockResolvedValue({
        entity: makeRegistryEntity({
          kennitala: '5501234567',
          nafn: 'Acme ehf.',
          heimili: 'Suðurgata 1',
          sveitarfelag: 'Reykjavík',
          postaritun: '101',
        }),
      })
      findOne.mockResolvedValue(
        makeCompanyModel({
          id: 'company-1',
          name: 'Acme ehf.',
          nationalId: '5501234567',
          employeeCountCategory: CompanySizeEnum.SMALL,
        }),
      )

      const result = await service.getOrCreateSubsidiaryReportSnapshotSource({
        name: 'Ignored name',
        nationalId: '5501234567',
      })

      expect(getEntityByNationalId).toHaveBeenCalledWith('5501234567')
      expect(findOne).toHaveBeenCalledWith({
        where: { nationalId: '5501234567' },
      })
      expect(create).not.toHaveBeenCalled()
      expect(result).toEqual({
        companyId: 'company-1',
        name: 'Acme ehf.',
        nationalId: '5501234567',
        address: 'Suðurgata 1',
        city: 'Reykjavík',
        postcode: '101',
        isatCategory: '',
      })
    })

    it('creates a live company row from the national registry name when no match exists', async () => {
      getEntityByNationalId.mockResolvedValue({
        entity: makeRegistryEntity({
          kennitala: '6601234567',
          nafn: 'Subsidiary ehf.',
          heimili: 'Hafnarstræti 5',
          sveitarfelag: 'Akureyri',
          postaritun: '600',
        }),
      })
      findOne.mockResolvedValue(null)
      create.mockResolvedValue(
        makeCompanyModel({
          id: 'company-2',
          name: 'Subsidiary ehf.',
          nationalId: '6601234567',
          employeeCountCategory: CompanySizeEnum.UNKNOWN,
        }),
      )

      const result = await service.getOrCreateSubsidiaryReportSnapshotSource({
        name: 'Submitted name',
        nationalId: '6601234567',
      })

      expect(create).toHaveBeenCalledWith({
        name: 'Subsidiary ehf.',
        nationalId: '6601234567',
        employeeCountCategory: CompanySizeEnum.UNKNOWN,
      })
      expect(result).toEqual({
        companyId: 'company-2',
        name: 'Subsidiary ehf.',
        nationalId: '6601234567',
        address: 'Hafnarstræti 5',
        city: 'Akureyri',
        postcode: '600',
        isatCategory: '',
      })
    })

    it('throws NotFoundException when the national registry has no matching entity', async () => {
      getEntityByNationalId.mockResolvedValue({ entity: null })

      await expect(
        service.getOrCreateSubsidiaryReportSnapshotSource({
          name: 'Anything',
          nationalId: '0000000000',
        }),
      ).rejects.toThrow(NotFoundException)

      expect(findOne).not.toHaveBeenCalled()
      expect(create).not.toHaveBeenCalled()
    })
  })

  describe('create', () => {
    it('emits a CREATED event after inserting the company', async () => {
      findOne.mockResolvedValue(null)
      create.mockResolvedValue(
        makeCompanyModel({
          id: 'company-9',
          status: CompanyStatusEnum.ACTIVE,
        }),
      )

      await service.create({
        name: 'New ehf.',
        nationalId: '5501234567',
        employeeCountCategory: CompanySizeEnum.SMALL,
      })

      expect(emitCreated).toHaveBeenCalledWith(
        'company-9',
        CompanyStatusEnum.ACTIVE,
      )
    })
  })

  describe('updateStatus', () => {
    it('updates the status and emits STATUS_CHANGED with the reason', async () => {
      const update = jest.fn()
      let current = CompanyStatusEnum.ACTIVE
      const company = {
        id: 'company-1',
        get status() {
          return current
        },
        update: update.mockImplementation(async ({ status }) => {
          current = status
        }),
        fromModel: () => ({ id: 'company-1', status: current }),
      }
      findOneOrThrow.mockResolvedValue(company)

      const result = await service.updateStatus(
        'company-1',
        { status: CompanyStatusEnum.INACTIVE, reason: 'bankruptcy' },
        'admin-1',
      )

      expect(update).toHaveBeenCalledWith({
        status: CompanyStatusEnum.INACTIVE,
      })
      expect(emitStatusChanged).toHaveBeenCalledWith(
        'company-1',
        CompanyStatusEnum.ACTIVE,
        CompanyStatusEnum.INACTIVE,
        'admin-1',
        'bankruptcy',
      )
      expect(result.status).toBe(CompanyStatusEnum.INACTIVE)
    })

    it('is a no-op when the status is unchanged', async () => {
      const update = jest.fn()
      findOneOrThrow.mockResolvedValue({
        id: 'company-1',
        status: CompanyStatusEnum.ACTIVE,
        update,
        fromModel: () => ({ id: 'company-1', status: CompanyStatusEnum.ACTIVE }),
      })

      await service.updateStatus(
        'company-1',
        { status: CompanyStatusEnum.ACTIVE },
        'admin-1',
      )

      expect(update).not.toHaveBeenCalled()
      expect(emitStatusChanged).not.toHaveBeenCalled()
    })

    it('throws NotFoundException when the company does not exist', async () => {
      findOneOrThrow.mockRejectedValue(new NotFoundException())

      await expect(
        service.updateStatus(
          'missing',
          { status: CompanyStatusEnum.INACTIVE },
          'admin-1',
        ),
      ).rejects.toThrow(NotFoundException)

      expect(emitStatusChanged).not.toHaveBeenCalled()
    })
  })

  describe('getTimeline', () => {
    it('merges events and comments sorted ascending by createdAt', async () => {
      findOneOrThrow.mockResolvedValue(makeCompanyModel({ id: 'company-1' }))
      eventsByCompanyId.mockResolvedValue([
        { id: 'e1', companyId: 'company-1', createdAt: new Date('2026-01-01') },
      ])
      commentsByCompanyId.mockResolvedValue([
        { id: 'c1', companyId: 'company-1', createdAt: new Date('2026-02-01') },
      ])

      const timeline = await service.getTimeline('company-1')

      expect(timeline).toHaveLength(2)
      expect(timeline[0]).toMatchObject({
        kind: CompanyTimelineItemKindEnum.EVENT,
        event: { id: 'e1' },
        comment: null,
      })
      expect(timeline[1]).toMatchObject({
        kind: CompanyTimelineItemKindEnum.COMMENT,
        comment: { id: 'c1' },
        event: null,
      })
    })

    it('throws NotFoundException when the company does not exist', async () => {
      findOneOrThrow.mockRejectedValue(new NotFoundException())

      await expect(service.getTimeline('missing')).rejects.toThrow(
        NotFoundException,
      )
    })
  })
})

function makeRegistryEntity(
  overrides: Partial<NationalRegistryEntityDto> = {},
): NationalRegistryEntityDto {
  return {
    stada: 'A',
    kennitala: '5501234567',
    nafn: 'Acme ehf.',
    loghHusk: '',
    heimili: 'Suðurgata 1',
    postaritun: '101',
    sveitarfelag: 'Reykjavík',
    svfNr: '0000',
    kynkodi: 0,
    ...overrides,
  }
}

function makeCompanyModel(overrides: Partial<CompanyModel> = {}): CompanyModel {
  const fields = {
    id: 'company-1',
    name: 'Acme ehf.',
    nationalId: '5501234567',
    employeeCountCategory: CompanySizeEnum.SMALL,
    ...overrides,
  }
  return {
    ...fields,
    fromModel: () => ({ ...fields }),
  } as unknown as CompanyModel
}
