import { BadRequestException, NotFoundException } from '@nestjs/common'
import { getModelToken } from '@nestjs/sequelize'
import { Test } from '@nestjs/testing'

import {
  INationalRegistryService,
  NationalRegistryEntityDto,
} from '@dmr.is/clients-national-registry'
import { IRskCompanyRegistryService } from '@dmr.is/clients-rsk-client'
import { LOGGER_PROVIDER } from '@dmr.is/logging'

import { ICompanyCommentService } from '../company-comment/company-comment.service.interface'
import { ICompanyEventService } from '../company-event/company-event.service.interface'
import { PostcodeModel } from '../location/models/postcode.model'
import { CompanyTimelineItemKindEnum } from './dto/company-timeline-item.dto'
import {
  CompanySectorEnum,
  CompanySizeEnum,
  CompanyStatusEnum,
} from './models/company.enums'
import { CompanyModel } from './models/company.model'
import { IsatCategoryModel } from './models/isat-category.model'
import { IsatSectionModel } from './models/isat-section.model'
import { companyMessages } from './company.messages'
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
  let getLegalEntityByNationalId: jest.Mock
  let emitCreated: jest.Mock
  let emitStatusChanged: jest.Mock
  let emitFinesStarted: jest.Mock
  let emitFinesStopped: jest.Mock
  let emitQuarantined: jest.Mock
  let emitUnquarantined: jest.Mock
  let eventsByCompanyId: jest.Mock
  let commentsByCompanyId: jest.Mock
  let isatFindByPk: jest.Mock
  let isatSectionFindAll: jest.Mock
  let postcodeFindOne: jest.Mock

  beforeEach(async () => {
    findOneOrThrow = jest.fn()
    findOne = jest.fn()
    create = jest.fn()
    isatFindByPk = jest.fn()
    isatSectionFindAll = jest.fn()
    postcodeFindOne = jest.fn()
    getEntityByNationalId = jest.fn()
    getLegalEntityByNationalId = jest.fn()
    emitCreated = jest.fn()
    emitStatusChanged = jest.fn()
    emitFinesStarted = jest.fn()
    emitFinesStopped = jest.fn()
    emitQuarantined = jest.fn()
    emitUnquarantined = jest.fn()
    eventsByCompanyId = jest.fn().mockResolvedValue([])
    commentsByCompanyId = jest.fn().mockResolvedValue([])

    // `.scope('withReportStatus')` returns a scoped copy of the model; the
    // service then calls findOne/findOneOrThrow on it. Resolve scope back to
    // the same mock so those calls land on the shared jest.fns.
    const companyModelMock: Record<string, unknown> = {
      findOneOrThrow,
      findOne,
      create,
    }
    companyModelMock.scope = jest.fn(() => companyModelMock)

    const module = await Test.createTestingModule({
      providers: [
        CompanyService,
        { provide: LOGGER_PROVIDER, useValue: mockLogger },
        {
          provide: INationalRegistryService,
          useValue: { getEntityByNationalId },
        },
        {
          provide: IRskCompanyRegistryService,
          useValue: { getLegalEntityByNationalId },
        },
        {
          provide: getModelToken(CompanyModel),
          useValue: companyModelMock,
        },
        {
          provide: getModelToken(IsatCategoryModel),
          useValue: { findByPk: isatFindByPk },
        },
        {
          provide: getModelToken(IsatSectionModel),
          useValue: { findAll: isatSectionFindAll },
        },
        {
          provide: getModelToken(PostcodeModel),
          useValue: { findOne: postcodeFindOne },
        },
        {
          provide: ICompanyEventService,
          useValue: {
            emitCreated,
            emitStatusChanged,
            emitFinesStarted,
            emitFinesStopped,
            emitQuarantined,
            emitUnquarantined,
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
      companyMessages.notFoundByNationalId('5501234567'),
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
      // loadCompanyDto re-reads the created row through the report-status scope.
      findOneOrThrow.mockResolvedValue(
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

      // RSK is unreachable in this test (getLegalEntityByNationalId is unmocked),
      // which must degrade the sector rather than block the provisioning.
      expect(create).toHaveBeenCalledWith({
        name: 'Registry Name ehf.',
        nationalId: '6601234567',
        employeeCountCategory: CompanySizeEnum.UNKNOWN,
        sector: CompanySectorEnum.UNKNOWN,
        legalFormId: null,
        legalFormName: null,
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
      findOneOrThrow.mockResolvedValue(
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
        sector: CompanySectorEnum.UNKNOWN,
        legalFormId: null,
        legalFormName: null,
      })
      expect(result.name).toBe('Body-provided name')
    })

    it('classifies the sector of an auto-provisioned company from RSK', async () => {
      // Auto-provisioning used to leave sector UNKNOWN permanently, so the
      // unclassified set grew every time an application arrived for a company
      // we had never seen.
      findOne.mockResolvedValue(null)
      getEntityByNationalId.mockResolvedValue({
        entity: makeRegistryEntity({
          kennitala: '6601234567',
          nafn: 'Ríkisútvarpið ohf.',
        }),
      })
      getLegalEntityByNationalId.mockResolvedValue({
        nationalId: '6601234567',
        name: 'Ríkisútvarpið ohf.',
        deregistration: { deregistered: false },
        legalForm: { id: 'ohf', name: 'Opinbert hlutafélag' },
        addresses: [],
        activityCode: [],
      })
      create.mockResolvedValue(makeCompanyModel({ id: 'company-4' }))
      findOneOrThrow.mockResolvedValue(makeCompanyModel({ id: 'company-4' }))

      await service.getOrCreateByNationalId('6601234567')

      expect(create).toHaveBeenCalledWith(
        expect.objectContaining({
          sector: CompanySectorEnum.PUBLIC,
          legalFormId: 'ohf',
          legalFormName: 'Opinbert hlutafélag',
        }),
      )
    })

    it('does not inherit RSK status on the auto-provisioning path', async () => {
      // A deregistered RSK record must not create the company INACTIVE here:
      // this path exists so an incoming submission can be filed against the
      // company, and an INACTIVE row would block the very submission that
      // triggered the provisioning. Ownership is safe to take; lifecycle is not.
      findOne.mockResolvedValue(null)
      getEntityByNationalId.mockResolvedValue({
        entity: makeRegistryEntity({
          kennitala: '9901234567',
          nafn: 'Afskráð ehf.',
        }),
      })
      getLegalEntityByNationalId.mockResolvedValue({
        nationalId: '9901234567',
        name: 'Afskráð ehf.',
        status: 'Afskráð',
        deregistration: { deregistered: true },
        legalForm: { id: 'ehf', name: 'Einkahlutafélag' },
        addresses: [],
        activityCode: [],
      })
      create.mockResolvedValue(makeCompanyModel({ id: 'company-5' }))
      findOneOrThrow.mockResolvedValue(makeCompanyModel({ id: 'company-5' }))

      await service.getOrCreateByNationalId('9901234567')

      const createArg = create.mock.calls[0][0]
      expect(createArg.sector).toBe(CompanySectorEnum.PRIVATE)
      expect(createArg).not.toHaveProperty('status')
      expect(createArg).not.toHaveProperty('address')
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
        sector: CompanySectorEnum.UNKNOWN,
        legalFormId: null,
        legalFormName: null,
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
      // loadCompanyDto re-reads the created row through the report-status scope.
      findOneOrThrow.mockResolvedValue(makeCompanyModel({ id: 'company-9' }))

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

    it('enriches the new company with mapped RSK values', async () => {
      findOne.mockResolvedValue(null)
      getLegalEntityByNationalId.mockResolvedValue({
        nationalId: '5501234567',
        name: 'RSK ehf.',
        deregistration: { deregistered: false },
        addresses: [{ addressName: 'Borgartún 1', postcode: '105 Reykjavík' }],
        activityCode: [{ codeSystem: 'ÍSAT2008', id: '62.01.0' }],
      })
      postcodeFindOne.mockResolvedValue({ id: 'postcode-105' })
      isatFindByPk.mockResolvedValue({ code: '62010' })
      create.mockResolvedValue(makeCompanyModel({ id: 'company-10' }))
      findOneOrThrow.mockResolvedValue(makeCompanyModel({ id: 'company-10' }))

      await service.create({
        name: 'New ehf.',
        nationalId: '5501234567',
        employeeCountCategory: CompanySizeEnum.SMALL,
      })

      expect(postcodeFindOne).toHaveBeenCalledWith({ where: { code: '105' } })
      expect(isatFindByPk).toHaveBeenCalledWith('62010')
      expect(create).toHaveBeenCalledWith({
        name: 'New ehf.',
        nationalId: '5501234567',
        employeeCountCategory: CompanySizeEnum.SMALL,
        status: CompanyStatusEnum.ACTIVE,
        address: 'Borgartún 1',
        postcodeId: 'postcode-105',
        isatCategoryCode: '62010',
        // RSK carried no legalForm, so the sector stays UNKNOWN — never guessed
        // as PRIVATE.
        sector: CompanySectorEnum.UNKNOWN,
        legalFormId: null,
        legalFormName: null,
      })
    })

    it('classifies a private legal form as PRIVATE and persists the raw RSK form', async () => {
      findOne.mockResolvedValue(null)
      getLegalEntityByNationalId.mockResolvedValue({
        nationalId: '5501234567',
        name: 'RSK ehf.',
        deregistration: { deregistered: false },
        legalForm: { id: 'ehf', name: 'Einkahlutafélag' },
        addresses: [],
        activityCode: [],
      })
      postcodeFindOne.mockResolvedValue(null)
      create.mockResolvedValue(makeCompanyModel({ id: 'company-11' }))
      findOneOrThrow.mockResolvedValue(makeCompanyModel({ id: 'company-11' }))

      await service.create({
        name: 'New ehf.',
        nationalId: '5501234567',
        employeeCountCategory: CompanySizeEnum.SMALL,
      })

      expect(create).toHaveBeenCalledWith(
        expect.objectContaining({
          sector: CompanySectorEnum.PRIVATE,
          legalFormId: 'ehf',
          legalFormName: 'Einkahlutafélag',
        }),
      )
    })

    it('classifies ohf (state-owned hlutafélag) as PUBLIC, not PRIVATE', async () => {
      findOne.mockResolvedValue(null)
      getLegalEntityByNationalId.mockResolvedValue({
        nationalId: '5501234567',
        name: 'Ríkisfyrirtæki ohf.',
        deregistration: { deregistered: false },
        legalForm: { id: 'ohf', name: 'Opinbert hlutafélag' },
        addresses: [],
        activityCode: [],
      })
      postcodeFindOne.mockResolvedValue(null)
      create.mockResolvedValue(makeCompanyModel({ id: 'company-12' }))
      findOneOrThrow.mockResolvedValue(makeCompanyModel({ id: 'company-12' }))

      await service.create({
        name: 'Ríkisfyrirtæki ohf.',
        nationalId: '5501234567',
        employeeCountCategory: CompanySizeEnum.SMALL,
      })

      expect(create).toHaveBeenCalledWith(
        expect.objectContaining({ sector: CompanySectorEnum.PUBLIC }),
      )
    })

    it('leaves an unrecognized legal form UNKNOWN and logs the unmapped key', async () => {
      findOne.mockResolvedValue(null)
      getLegalEntityByNationalId.mockResolvedValue({
        nationalId: '5501234567',
        name: 'Something odd',
        deregistration: { deregistered: false },
        legalForm: { id: 'ZZ-99', name: 'Eitthvað allt annað' },
        addresses: [],
        activityCode: [],
      })
      postcodeFindOne.mockResolvedValue(null)
      create.mockResolvedValue(makeCompanyModel({ id: 'company-13' }))
      findOneOrThrow.mockResolvedValue(makeCompanyModel({ id: 'company-13' }))

      await service.create({
        name: 'Something odd',
        nationalId: '5501234567',
        employeeCountCategory: CompanySizeEnum.SMALL,
      })

      expect(create).toHaveBeenCalledWith(
        expect.objectContaining({
          sector: CompanySectorEnum.UNKNOWN,
          legalFormId: 'ZZ-99',
          legalFormName: 'Eitthvað allt annað',
        }),
      )
      // The warning is how the real RSK vocabulary surfaces from production.
      // Both candidates are reported: if RSK's id turns out to be an opaque
      // code, the meaningful token is the name.
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('zz99'),
        expect.objectContaining({
          unmappedLegalFormKeys: ['zz99', 'eitthvadalltannad'],
        }),
      )
    })

    it('rejects creating a company that is inactive in RSK', async () => {
      findOne.mockResolvedValue(null)
      getLegalEntityByNationalId.mockResolvedValue({
        nationalId: '5501234567',
        name: 'RSK ehf.',
        deregistration: { deregistered: true },
      })

      await expect(
        service.create({
          name: 'New ehf.',
          nationalId: '5501234567',
          employeeCountCategory: CompanySizeEnum.SMALL,
        }),
      ).rejects.toBeInstanceOf(BadRequestException)

      expect(create).not.toHaveBeenCalled()
    })

    it('previews the RSK status and reason without persisting', async () => {
      getLegalEntityByNationalId.mockResolvedValue({
        nationalId: '5501234567',
        name: 'RSK ehf.',
        status: 'Afskráð',
        deregistration: { deregistered: true },
      })

      const preview = await service.getRskCompanyPreview('5501234567')

      expect(preview).toEqual({
        name: 'RSK ehf.',
        nationalId: '5501234567',
        status: CompanyStatusEnum.INACTIVE,
        statusReason: 'Afskráð',
        address: null,
        postcode: null,
        isatCategory: null,
        sector: CompanySectorEnum.UNKNOWN,
        legalFormName: null,
      })
      expect(create).not.toHaveBeenCalled()
    })

    it('previews the sector create will store, from the same RSK call', async () => {
      // The create screen is the cheapest place for an admin to notice a
      // state-owned company came back classified — or came back UNKNOWN.
      getLegalEntityByNationalId.mockResolvedValue({
        nationalId: '5501234567',
        name: 'Ríkisútvarpið ohf.',
        deregistration: { deregistered: false },
        legalForm: { id: 'ohf', name: 'Opinbert hlutafélag' },
        addresses: [],
        activityCode: [],
      })
      postcodeFindOne.mockResolvedValue(null)

      const preview = await service.getRskCompanyPreview('5501234567')

      expect(preview.sector).toBe(CompanySectorEnum.PUBLIC)
      expect(preview.legalFormName).toBe('Opinbert hlutafélag')
      expect(getLegalEntityByNationalId).toHaveBeenCalledTimes(1)
      expect(create).not.toHaveBeenCalled()
    })

    it('creates from base input when RSK enrichment fails', async () => {
      findOne.mockResolvedValue(null)
      getLegalEntityByNationalId.mockRejectedValue(new Error('RSK down'))
      create.mockResolvedValue(makeCompanyModel({ id: 'company-11' }))
      findOneOrThrow.mockResolvedValue(makeCompanyModel({ id: 'company-11' }))

      await service.create({
        name: 'New ehf.',
        nationalId: '5501234567',
        employeeCountCategory: CompanySizeEnum.SMALL,
      })

      expect(create).toHaveBeenCalledWith({
        name: 'New ehf.',
        nationalId: '5501234567',
        employeeCountCategory: CompanySizeEnum.SMALL,
      })
      expect(postcodeFindOne).not.toHaveBeenCalled()
      expect(isatFindByPk).not.toHaveBeenCalled()
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
        fromModel: () => ({
          id: 'company-1',
          status: CompanyStatusEnum.ACTIVE,
        }),
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

  describe('updateFines', () => {
    const makeFinesCompany = (finesStarted: boolean) => {
      let current = finesStarted
      const update = jest.fn().mockImplementation(async (values) => {
        if ('finesStarted' in values) current = values.finesStarted
      })
      return {
        id: 'company-1',
        status: CompanyStatusEnum.ACTIVE,
        get finesStarted() {
          return current
        },
        update,
        fromModel: () => ({ id: 'company-1', finesStarted: current }),
        _update: update,
      }
    }

    it('starts fines and emits FINES_STARTED with the reason', async () => {
      const company = makeFinesCompany(false)
      findOneOrThrow.mockResolvedValue(company)

      const result = await service.updateFines(
        'company-1',
        { finesStarted: true, reason: 'missed deadline' },
        'admin-1',
      )

      expect(company._update).toHaveBeenCalledWith({ finesStarted: true })
      expect(emitFinesStarted).toHaveBeenCalledWith(
        'company-1',
        CompanyStatusEnum.ACTIVE,
        'admin-1',
        'missed deadline',
      )
      expect(emitFinesStopped).not.toHaveBeenCalled()
      expect(result.finesStarted).toBe(true)
    })

    it('stops fines and emits FINES_STOPPED', async () => {
      const company = makeFinesCompany(true)
      findOneOrThrow.mockResolvedValue(company)

      await service.updateFines(
        'company-1',
        { finesStarted: false },
        'admin-1',
      )

      expect(company._update).toHaveBeenCalledWith({ finesStarted: false })
      expect(emitFinesStopped).toHaveBeenCalledWith(
        'company-1',
        CompanyStatusEnum.ACTIVE,
        'admin-1',
        null,
      )
      expect(emitFinesStarted).not.toHaveBeenCalled()
    })

    it('is a no-op when the flag is unchanged', async () => {
      const company = makeFinesCompany(false)
      findOneOrThrow.mockResolvedValue(company)

      await service.updateFines('company-1', { finesStarted: false }, 'admin-1')

      expect(company._update).not.toHaveBeenCalled()
      expect(emitFinesStarted).not.toHaveBeenCalled()
      expect(emitFinesStopped).not.toHaveBeenCalled()
    })

    it('throws NotFoundException when the company does not exist', async () => {
      findOneOrThrow.mockRejectedValue(new NotFoundException())

      await expect(
        service.updateFines('missing', { finesStarted: true }, 'admin-1'),
      ).rejects.toThrow(NotFoundException)

      expect(emitFinesStarted).not.toHaveBeenCalled()
    })
  })

  describe('updateQuarantine', () => {
    const makeQuarantineCompany = (quarantined: boolean) => {
      let current = quarantined
      const update = jest.fn().mockImplementation(async (values) => {
        if ('quarantined' in values) current = values.quarantined
      })
      return {
        id: 'company-1',
        status: CompanyStatusEnum.ACTIVE,
        get quarantined() {
          return current
        },
        update,
        fromModel: () => ({ id: 'company-1', quarantined: current }),
        _update: update,
      }
    }

    it('quarantines and emits QUARANTINED with the reason', async () => {
      const company = makeQuarantineCompany(false)
      findOneOrThrow.mockResolvedValue(company)

      const result = await service.updateQuarantine(
        'company-1',
        { quarantined: true, reason: 'special case' },
        'admin-1',
      )

      expect(company._update).toHaveBeenCalledWith({ quarantined: true })
      expect(emitQuarantined).toHaveBeenCalledWith(
        'company-1',
        CompanyStatusEnum.ACTIVE,
        'admin-1',
        'special case',
      )
      expect(emitUnquarantined).not.toHaveBeenCalled()
      expect(result.quarantined).toBe(true)
    })

    it('lifts quarantine and emits UNQUARANTINED', async () => {
      const company = makeQuarantineCompany(true)
      findOneOrThrow.mockResolvedValue(company)

      await service.updateQuarantine(
        'company-1',
        { quarantined: false },
        'admin-1',
      )

      expect(company._update).toHaveBeenCalledWith({ quarantined: false })
      expect(emitUnquarantined).toHaveBeenCalledWith(
        'company-1',
        CompanyStatusEnum.ACTIVE,
        'admin-1',
        null,
      )
      expect(emitQuarantined).not.toHaveBeenCalled()
    })

    it('is a no-op when the flag is unchanged', async () => {
      const company = makeQuarantineCompany(false)
      findOneOrThrow.mockResolvedValue(company)

      await service.updateQuarantine(
        'company-1',
        { quarantined: false },
        'admin-1',
      )

      expect(company._update).not.toHaveBeenCalled()
      expect(emitQuarantined).not.toHaveBeenCalled()
      expect(emitUnquarantined).not.toHaveBeenCalled()
    })

    it('throws NotFoundException when the company does not exist', async () => {
      findOneOrThrow.mockRejectedValue(new NotFoundException())

      await expect(
        service.updateQuarantine('missing', { quarantined: true }, 'admin-1'),
      ).rejects.toThrow(NotFoundException)

      expect(emitQuarantined).not.toHaveBeenCalled()
    })
  })

  describe('updateSector', () => {
    // `updateSector` re-reads through the withReportStatus scope after writing,
    // so findOneOrThrow is stubbed twice: the loaded row, then the reload.
    const stubCompany = (fields: Record<string, unknown>) => {
      const update = jest.fn()
      findOneOrThrow
        .mockResolvedValueOnce({
          id: 'company-20',
          update,
          fromModel: () => ({ id: 'company-20' }),
          ...fields,
        })
        .mockResolvedValueOnce({
          fromModel: () => ({ id: 'company-20' }),
        })
      return update
    }

    it('sets PUBLIC and marks the classification admin-owned', async () => {
      const update = stubCompany({
        sector: CompanySectorEnum.UNKNOWN,
        sectorOverride: false,
      })

      await service.updateSector(
        'company-20',
        { sector: CompanySectorEnum.PUBLIC },
        'admin-1',
      )

      expect(update).toHaveBeenCalledWith({
        sector: CompanySectorEnum.PUBLIC,
        sectorOverride: true,
      })
    })

    it('clears the override when set back to UNKNOWN, handing it to automatic classification', async () => {
      const update = stubCompany({
        sector: CompanySectorEnum.PRIVATE,
        sectorOverride: true,
      })

      await service.updateSector(
        'company-20',
        { sector: CompanySectorEnum.UNKNOWN },
        'admin-1',
      )

      expect(update).toHaveBeenCalledWith({
        sector: CompanySectorEnum.UNKNOWN,
        sectorOverride: false,
      })
    })

    it('is a no-op when the sector and override are both unchanged', async () => {
      const update = stubCompany({
        sector: CompanySectorEnum.PRIVATE,
        sectorOverride: true,
      })

      await service.updateSector(
        'company-20',
        { sector: CompanySectorEnum.PRIVATE },
        'admin-1',
      )

      expect(update).not.toHaveBeenCalled()
    })

    it('still writes when the sector matches but the override flag does not', async () => {
      // An automatically-derived PRIVATE that an admin confirms by hand must
      // become admin-owned, or the next backfill could silently change it.
      const update = stubCompany({
        sector: CompanySectorEnum.PRIVATE,
        sectorOverride: false,
      })

      await service.updateSector(
        'company-20',
        { sector: CompanySectorEnum.PRIVATE },
        'admin-1',
      )

      expect(update).toHaveBeenCalledWith({
        sector: CompanySectorEnum.PRIVATE,
        sectorOverride: true,
      })
    })

    it('leaves the raw RSK legal form untouched', async () => {
      const update = stubCompany({
        sector: CompanySectorEnum.UNKNOWN,
        sectorOverride: false,
        legalFormId: 'ZZ-99',
        legalFormName: 'Eitthvað annað',
      })

      await service.updateSector(
        'company-20',
        { sector: CompanySectorEnum.PUBLIC },
        'admin-1',
      )

      const written = update.mock.calls[0][0]
      expect(written).not.toHaveProperty('legalFormId')
      expect(written).not.toHaveProperty('legalFormName')
    })
  })

  describe('updateIsat', () => {
    it('sets a valid ÍSAT code after validating it exists', async () => {
      const update = jest.fn()
      findOneOrThrow
        .mockResolvedValueOnce({
          id: 'company-1',
          isatCategoryCode: null,
          update,
          fromModel: () => ({ id: 'company-1' }),
        })
        .mockResolvedValueOnce({
          fromModel: () => ({ id: 'company-1', isatCategoryCode: '01110' }),
        })
      isatFindByPk.mockResolvedValue({ code: '01110' })

      const result = await service.updateIsat(
        'company-1',
        { isatCategoryCode: '01110' },
        'admin-1',
      )

      expect(isatFindByPk).toHaveBeenCalledWith('01110')
      expect(update).toHaveBeenCalledWith({ isatCategoryCode: '01110' })
      expect(result.isatCategoryCode).toBe('01110')
    })

    it('rejects an unknown ÍSAT code and does not update', async () => {
      const update = jest.fn()
      findOneOrThrow.mockResolvedValueOnce({
        id: 'company-1',
        isatCategoryCode: null,
        update,
        fromModel: () => ({ id: 'company-1' }),
      })
      isatFindByPk.mockResolvedValue(null)

      await expect(
        service.updateIsat(
          'company-1',
          { isatCategoryCode: 'nope' },
          'admin-1',
        ),
      ).rejects.toThrow(BadRequestException)

      expect(update).not.toHaveBeenCalled()
    })

    it('clears the classification when passed null (no code lookup)', async () => {
      const update = jest.fn()
      findOneOrThrow
        .mockResolvedValueOnce({
          id: 'company-1',
          isatCategoryCode: '01110',
          update,
          fromModel: () => ({ id: 'company-1' }),
        })
        .mockResolvedValueOnce({
          fromModel: () => ({ id: 'company-1', isatCategoryCode: null }),
        })

      const result = await service.updateIsat(
        'company-1',
        { isatCategoryCode: null },
        'admin-1',
      )

      expect(isatFindByPk).not.toHaveBeenCalled()
      expect(update).toHaveBeenCalledWith({ isatCategoryCode: null })
      expect(result.isatCategoryCode).toBeNull()
    })

    it('throws NotFoundException when the company does not exist', async () => {
      findOneOrThrow.mockRejectedValue(new NotFoundException())

      await expect(
        service.updateIsat('missing', { isatCategoryCode: '01110' }, 'admin-1'),
      ).rejects.toThrow(NotFoundException)
    })
  })

  describe('updateEmail', () => {
    const makeEmailCompany = (email: string | null) => {
      let current = email
      const update = jest.fn().mockImplementation(async (values) => {
        if ('email' in values) current = values.email
      })
      return {
        id: 'company-1',
        status: CompanyStatusEnum.ACTIVE,
        get email() {
          return current
        },
        update,
        fromModel: () => ({ id: 'company-1', email: current }),
        _update: update,
      }
    }

    it('sets a trimmed email', async () => {
      const company = makeEmailCompany(null)
      findOneOrThrow.mockResolvedValue(company)

      const result = await service.updateEmail(
        'company-1',
        { email: '  acme@acme.is  ' },
        'admin-1',
      )

      expect(company._update).toHaveBeenCalledWith({ email: 'acme@acme.is' })
      expect(result.email).toBe('acme@acme.is')
    })

    it('clears the email when passed null', async () => {
      const company = makeEmailCompany('acme@acme.is')
      findOneOrThrow.mockResolvedValue(company)

      const result = await service.updateEmail(
        'company-1',
        { email: null },
        'admin-1',
      )

      expect(company._update).toHaveBeenCalledWith({ email: null })
      expect(result.email).toBeNull()
    })

    it('is a no-op when the email is unchanged', async () => {
      const company = makeEmailCompany('acme@acme.is')
      findOneOrThrow.mockResolvedValue(company)

      await service.updateEmail(
        'company-1',
        { email: 'acme@acme.is' },
        'admin-1',
      )

      expect(company._update).not.toHaveBeenCalled()
    })

    it('throws NotFoundException when the company does not exist', async () => {
      findOneOrThrow.mockRejectedValue(new NotFoundException())

      await expect(
        service.updateEmail('missing', { email: 'acme@acme.is' }, 'admin-1'),
      ).rejects.toThrow(NotFoundException)
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
