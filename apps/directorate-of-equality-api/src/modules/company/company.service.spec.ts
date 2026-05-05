import { NotFoundException } from '@nestjs/common'
import { getModelToken } from '@nestjs/sequelize'
import { Test } from '@nestjs/testing'

import {
  INationalRegistryService,
  NationalRegistryEntityDto,
} from '@dmr.is/clients-national-registry'
import { LOGGER_PROVIDER } from '@dmr.is/logging'

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

  beforeEach(async () => {
    findOneOrThrow = jest.fn()
    findOne = jest.fn()
    create = jest.fn()
    getEntityByNationalId = jest.fn()

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
          averageEmployeeCountFromRsk: 12,
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
          averageEmployeeCountFromRsk: 0,
        }),
      )

      const result = await service.getOrCreateSubsidiaryReportSnapshotSource({
        name: 'Submitted name',
        nationalId: '6601234567',
      })

      expect(create).toHaveBeenCalledWith({
        name: 'Subsidiary ehf.',
        nationalId: '6601234567',
        averageEmployeeCountFromRsk: 0,
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
  return {
    id: 'company-1',
    name: 'Acme ehf.',
    nationalId: '5501234567',
    averageEmployeeCountFromRsk: 3,
    ...overrides,
  } as CompanyModel
}
