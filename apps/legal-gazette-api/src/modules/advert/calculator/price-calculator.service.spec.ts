import Kennitala from 'kennitala'

import { InternalServerErrorException } from '@nestjs/common'
import { getModelToken } from '@nestjs/sequelize'
import { Test, TestingModule } from '@nestjs/testing'

import { LOGGER_PROVIDER } from '@dmr.is/logging'

import { AdvertModel } from '../../../models/advert.model'
import { TBRCompanySettingsModel } from '../../../models/tbr-company-settings.model'
import { TypeModel } from '../../../models/type.model'
import { IApplicationService } from '../../applications/application.service.interface'
import { PriceCalculatorService } from './price-calculator.service'
// Mock Kennitala module
jest.mock('kennitala')
// Mock environment variables
const MOCK_ENV = {
  LG_TBR_CHARGE_CATEGORY_PERSON: 'RL1',
  LG_TBR_CHARGE_CATEGORY_COMPANY: 'RL2',
}
describe('PriceCalculatorService', () => {
  let service: PriceCalculatorService
  let tbrCompanySettingsModel: jest.Mocked<typeof TBRCompanySettingsModel>
  // Test data factories
  const createMockCompany = (overrides = {}) => ({
    id: 'company-123',
    // eslint-disable-next-line local-rules/disallow-kennitalas
    nationalId: '5402696029', // Valid company ID
    name: 'Test Company ehf.',
    email: 'test@company.is',
    phone: '+3545551234',
    active: true,
    code: 'TEST001',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  })
  beforeAll(() => {
    // Set environment variables
    Object.entries(MOCK_ENV).forEach(([key, value]) => {
      process.env[key] = value
    })
  })
  afterAll(() => {
    // Clean up environment variables
    Object.keys(MOCK_ENV).forEach((key) => {
      delete process.env[key]
    })
  })
  beforeEach(async () => {
    jest.clearAllMocks()
    // Mock Kennitala.isPerson - return true for IDs starting with 0-3, false for 4-9
    const mockedKennitala = Kennitala as jest.Mocked<typeof Kennitala>
    mockedKennitala.isPerson = jest.fn((id: string) => {
      const firstDigit = parseInt(id[0], 10)
      return firstDigit <= 3
    })
    // Create mock implementations
    const mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    }
    const mockApplicationService = {
      getApplicationById: jest.fn(),
      previewApplication: jest.fn(),
    }
    const mockAdvertModel = {}
    const mockTypeModel = {}
    const mockTbrCompanySettingsModel = {
      findOne: jest.fn(),
    }
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PriceCalculatorService,
        {
          provide: LOGGER_PROVIDER,
          useValue: mockLogger,
        },
        {
          provide: IApplicationService,
          useValue: mockApplicationService,
        },
        {
          provide: getModelToken(AdvertModel),
          useValue: mockAdvertModel,
        },
        {
          provide: getModelToken(TypeModel),
          useValue: mockTypeModel,
        },
        {
          provide: getModelToken(TBRCompanySettingsModel),
          useValue: mockTbrCompanySettingsModel,
        },
      ],
    }).compile()
    service = module.get<PriceCalculatorService>(PriceCalculatorService)
    tbrCompanySettingsModel = module.get(getModelToken(TBRCompanySettingsModel))
  })
  // ==========================================
  // getChargeCategory Tests
  // ==========================================
  describe('getChargeCategory', () => {
    describe('person national IDs', () => {
      it('should return RL1 for personal national ID', async () => {
        const personalId = '0101801234' // Personal ID (starts with 0-3)
        const result = await service.getChargeCategory(personalId)
        expect(result).toBe('RL1')
        expect(tbrCompanySettingsModel.findOne).not.toHaveBeenCalled()
      })
      it('should not query TBRCompanySettingsModel for person IDs', async () => {
        const personalId = '1503902119'
        await service.getChargeCategory(personalId)
        expect(tbrCompanySettingsModel.findOne).not.toHaveBeenCalled()
      })
      it('should throw error when LG_TBR_CHARGE_CATEGORY_PERSON is not set', async () => {
        delete process.env.LG_TBR_CHARGE_CATEGORY_PERSON
        const personalId = '0101801234'
        await expect(service.getChargeCategory(personalId)).rejects.toThrow(
          InternalServerErrorException,
        )
        await expect(service.getChargeCategory(personalId)).rejects.toThrow(
          'LG_TBR_CHARGE_CATEGORY_PERSON environment variable not set',
        )
        // Restore env var
        process.env.LG_TBR_CHARGE_CATEGORY_PERSON = 'RL1'
      })
    })
    describe('company national IDs - active companies', () => {
      it('should return RL2 for active company in TBR settings', async () => {
        // eslint-disable-next-line local-rules/disallow-kennitalas
        const companyId = '5402696029' // Company ID (starts with 4-9)
        tbrCompanySettingsModel.findOne.mockResolvedValue(
          createMockCompany({
            nationalId: companyId,
            active: true,
          }) as unknown as TBRCompanySettingsModel,
        )
        const result = await service.getChargeCategory(companyId)
        expect(result).toBe('RL2')
        expect(tbrCompanySettingsModel.findOne).toHaveBeenCalledWith({
          where: {
            nationalId: companyId,
            active: true,
          },
        })
      })
      it('should query TBRCompanySettingsModel with correct filters', async () => {
        // eslint-disable-next-line local-rules/disallow-kennitalas
        const companyId = '6509142340'
        tbrCompanySettingsModel.findOne.mockResolvedValue(
          createMockCompany({
            nationalId: companyId,
          }) as unknown as TBRCompanySettingsModel,
        )
        await service.getChargeCategory(companyId)
        expect(tbrCompanySettingsModel.findOne).toHaveBeenCalledWith({
          where: {
            nationalId: companyId,
            active: true,
          },
        })
      })
      it('should throw error when LG_TBR_CHARGE_CATEGORY_COMPANY is not set for active company', async () => {
        delete process.env.LG_TBR_CHARGE_CATEGORY_COMPANY
        // eslint-disable-next-line local-rules/disallow-kennitalas
        const companyId = '5402696029'
        tbrCompanySettingsModel.findOne.mockResolvedValue(
          createMockCompany({
            nationalId: companyId,
          }) as unknown as TBRCompanySettingsModel,
        )
        await expect(service.getChargeCategory(companyId)).rejects.toThrow(
          InternalServerErrorException,
        )
        await expect(service.getChargeCategory(companyId)).rejects.toThrow(
          'LG_TBR_CHARGE_CATEGORY_COMPANY environment variable not set',
        )
        // Restore env var
        process.env.LG_TBR_CHARGE_CATEGORY_COMPANY = 'RL2'
      })
    })
    describe('company national IDs - not found or inactive', () => {
      it('should return RL1 when company is not found in TBR settings', async () => {
        // eslint-disable-next-line local-rules/disallow-kennitalas
        const companyId = '5402696029'
        tbrCompanySettingsModel.findOne.mockResolvedValue(null)
        const result = await service.getChargeCategory(companyId)
        expect(result).toBe('RL1')
        expect(tbrCompanySettingsModel.findOne).toHaveBeenCalledWith({
          where: {
            nationalId: companyId,
            active: true,
          },
        })
      })
      it('should return RL1 when company is inactive', async () => {
        // eslint-disable-next-line local-rules/disallow-kennitalas
        const companyId = '5402696029'
        // findOne returns null because active: true filter excludes inactive companies
        tbrCompanySettingsModel.findOne.mockResolvedValue(null)
        const result = await service.getChargeCategory(companyId)
        expect(result).toBe('RL1')
      })
      it('should throw error when LG_TBR_CHARGE_CATEGORY_PERSON is not set for inactive company', async () => {
        delete process.env.LG_TBR_CHARGE_CATEGORY_PERSON
        // eslint-disable-next-line local-rules/disallow-kennitalas
        const companyId = '5402696029'
        tbrCompanySettingsModel.findOne.mockResolvedValue(null)
        await expect(service.getChargeCategory(companyId)).rejects.toThrow(
          InternalServerErrorException,
        )
        await expect(service.getChargeCategory(companyId)).rejects.toThrow(
          'LG_TBR_CHARGE_CATEGORY_PERSON environment variable not set',
        )
        // Restore env var
        process.env.LG_TBR_CHARGE_CATEGORY_PERSON = 'RL1'
      })
    })
    describe('edge cases', () => {
      it('should handle Kennitala.isPerson() returning false for company IDs', async () => {
        // eslint-disable-next-line local-rules/disallow-kennitalas
        const companyId = '4709201230' // Company ID
        tbrCompanySettingsModel.findOne.mockResolvedValue(null)
        expect(Kennitala.isPerson(companyId)).toBe(false)
        const result = await service.getChargeCategory(companyId)
        expect(result).toBe('RL1')
        expect(tbrCompanySettingsModel.findOne).toHaveBeenCalled()
      })
      it('should handle database errors when querying TBRCompanySettingsModel', async () => {
        // eslint-disable-next-line local-rules/disallow-kennitalas
        const companyId = '5402696029'
        const dbError = new Error('Database connection lost')
        tbrCompanySettingsModel.findOne.mockRejectedValue(dbError)
        await expect(service.getChargeCategory(companyId)).rejects.toThrow(
          'Database connection lost',
        )
      })
    })
    describe('logging', () => {
      it('should log when TBR company is found', async () => {
        const mockLogger = service['logger']
        // eslint-disable-next-line local-rules/disallow-kennitalas
        const companyId = '5402696029'
        const mockCompany = createMockCompany({
          nationalId: companyId,
          name: 'Hugsmíðjan ehf.',
        })
        tbrCompanySettingsModel.findOne.mockResolvedValue(
          mockCompany as unknown as TBRCompanySettingsModel,
        )
        await service.getChargeCategory(companyId)
        expect(mockLogger.info).toHaveBeenCalledWith(
          'TBR company found for charge category',
          expect.objectContaining({
            nationalId: companyId,
            companyName: 'Hugsmíðjan ehf.',
            context: 'PriceCalculatorService',
          }),
        )
      })
      it('should log when TBR company is not found or inactive', async () => {
        const mockLogger = service['logger']
        // eslint-disable-next-line local-rules/disallow-kennitalas
        const companyId = '5402696029'
        tbrCompanySettingsModel.findOne.mockResolvedValue(null)
        await service.getChargeCategory(companyId)
        expect(mockLogger.info).toHaveBeenCalledWith(
          'TBR company not found or inactive, using person charge category',
          expect.objectContaining({
            nationalId: companyId,
            context: 'PriceCalculatorService',
          }),
        )
      })
    })
  })
})
