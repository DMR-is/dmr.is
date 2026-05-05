import { NotFoundException } from '@nestjs/common'
import { getModelToken } from '@nestjs/sequelize'
import { Test } from '@nestjs/testing'

import { INationalRegistryService } from '@dmr.is/clients-national-registry'
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

  beforeEach(async () => {
    findOneOrThrow = jest.fn()
    findOne = jest.fn()
    create = jest.fn()

    const module = await Test.createTestingModule({
      providers: [
        CompanyService,
        { provide: LOGGER_PROVIDER, useValue: mockLogger },
        {
          provide: INationalRegistryService,
          useValue: { getEntityByNationalId: jest.fn() },
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

  describe('getOrCreateReportSnapshotSource', () => {
    it('returns existing company data with placeholder snapshot-only fields', async () => {
      findOne.mockResolvedValue(
        makeCompanyModel({
          id: 'company-1',
          name: 'Acme ehf.',
          nationalId: '5501234567',
          averageEmployeeCountFromRsk: 12,
        }),
      )

      const result = await service.getOrCreateReportSnapshotSource({
        name: 'Ignored name',
        nationalId: '5501234567',
      })

      expect(findOne).toHaveBeenCalledWith({
        where: { nationalId: '5501234567' },
      })
      expect(create).not.toHaveBeenCalled()
      expect(result).toEqual({
        companyId: 'company-1',
        name: 'Acme ehf.',
        nationalId: '5501234567',
        address: '',
        city: '',
        postcode: '',
        isatCategory: '',
      })
    })

    it('creates a minimal live company row while the external lookup is a placeholder', async () => {
      findOne.mockResolvedValue(null)
      create.mockResolvedValue(
        makeCompanyModel({
          id: 'company-2',
          name: 'Subsidiary ehf.',
          nationalId: '6601234567',
          averageEmployeeCountFromRsk: 0,
        }),
      )

      const result = await service.getOrCreateReportSnapshotSource({
        name: 'Subsidiary ehf.',
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
        address: '',
        city: '',
        postcode: '',
        isatCategory: '',
      })
    })
  })
})

function makeCompanyModel(overrides: Partial<CompanyModel> = {}): CompanyModel {
  return {
    id: 'company-1',
    name: 'Acme ehf.',
    nationalId: '5501234567',
    averageEmployeeCountFromRsk: 3,
    ...overrides,
  } as CompanyModel
}
