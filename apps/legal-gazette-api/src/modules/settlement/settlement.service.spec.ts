import { BadRequestException } from '@nestjs/common'
import { getModelToken } from '@nestjs/sequelize'
import { Test, TestingModule } from '@nestjs/testing'

import { LOGGER_PROVIDER } from '@dmr.is/logging'

import { AdvertModel } from '../../models/advert.model'
import {
  SettlementModel,
} from '../../models/settlement.model'
import { StatusIdEnum } from '../../models/status.model'
import { UpdateSettlementDto } from './dto/settlement.dto'
import { SettlementService } from './settlement.service'
// ==========================================
// Mock Factories
// ==========================================
interface MockAdvert {
  id: string
  statusId: StatusIdEnum
}
const createMockAdvert = (overrides: Partial<MockAdvert> = {}): MockAdvert => ({
  id: overrides.id || 'advert-123',
  statusId: overrides.statusId || StatusIdEnum.SUBMITTED,
})
interface MockSettlement {
  id: string
  liquidatorName: string
  liquidatorLocation: string
  name: string
  nationalId: string
  address: string
  deadline: Date | null
  dateOfDeath: Date | null
  declaredClaims: number | null
  partnerName: string | null
  partnerNationalId: string | null
  partnerDateOfDeath: Date | null
  adverts?: MockAdvert[]
  update: jest.Mock
}
const createMockSettlement = (
  overrides: Partial<MockSettlement> = {},
): MockSettlement => {
  const settlement: MockSettlement = {
    id: overrides.id || 'settlement-123',
    liquidatorName: overrides.liquidatorName || 'Test Liquidator',
    liquidatorLocation: overrides.liquidatorLocation || 'Reykjavik',
    name: overrides.name || 'Test Person',
    nationalId: overrides.nationalId || '1234567890',
    address: overrides.address || 'Test Address',
    deadline: overrides.deadline ?? null,
    dateOfDeath: overrides.dateOfDeath ?? null,
    declaredClaims: overrides.declaredClaims ?? null,
    partnerName: overrides.partnerName ?? null,
    partnerNationalId: overrides.partnerNationalId ?? null,
    partnerDateOfDeath: overrides.partnerDateOfDeath ?? null,
    adverts: overrides.adverts || [],
    update: jest.fn(),
  }
  settlement.update.mockImplementation((updates: Partial<MockSettlement>) => {
    Object.assign(settlement, updates)
    return Promise.resolve(settlement)
  })
  return settlement
}
// ==========================================
// Tests
// ==========================================
describe('SettlementService - Status Protection', () => {
  let service: SettlementService
  let settlementModel: jest.Mocked<typeof SettlementModel>
  beforeEach(async () => {
    const mockSettlementModel = {
      findByPkOrThrow: jest.fn(),
    }
    const mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    }
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettlementService,
        {
          provide: getModelToken(SettlementModel),
          useValue: mockSettlementModel,
        },
        {
          provide: LOGGER_PROVIDER,
          useValue: mockLogger,
        },
      ],
    }).compile()
    service = module.get<SettlementService>(SettlementService)
    settlementModel = module.get(getModelToken(SettlementModel))
  })
  describe('updateSettlement', () => {
    const updateDto: UpdateSettlementDto = {
      liquidatorName: 'Updated Liquidator',
      liquidatorLocation: 'Updated Location',
      name: 'Updated Name',
    }
    it('should allow update when no adverts are associated', async () => {
      const settlement = createMockSettlement({ adverts: [] })
      settlementModel.findByPkOrThrow.mockResolvedValue(
        settlement as unknown as SettlementModel,
      )
      await expect(
        service.updateSettlement('settlement-123', updateDto),
      ).resolves.not.toThrow()
      expect(settlement.update).toHaveBeenCalledWith(
        expect.objectContaining({
          liquidatorName: 'Updated Liquidator',
          liquidatorLocation: 'Updated Location',
          name: 'Updated Name',
        }),
      )
    })
    it('should allow update when all associated adverts are editable', async () => {
      const settlement = createMockSettlement({
        adverts: [
          createMockAdvert({ statusId: StatusIdEnum.SUBMITTED }),
          createMockAdvert({ statusId: StatusIdEnum.IN_PROGRESS }),
          createMockAdvert({ statusId: StatusIdEnum.READY_FOR_PUBLICATION }),
        ],
      })
      settlementModel.findByPkOrThrow.mockResolvedValue(
        settlement as unknown as SettlementModel,
      )
      await expect(
        service.updateSettlement('settlement-123', updateDto),
      ).resolves.not.toThrow()
      expect(settlement.update).toHaveBeenCalled()
    })
    it('should throw BadRequestException when any advert is PUBLISHED', async () => {
      const settlement = createMockSettlement({
        adverts: [
          createMockAdvert({ statusId: StatusIdEnum.SUBMITTED }),
          createMockAdvert({ statusId: StatusIdEnum.PUBLISHED }),
        ],
      })
      settlementModel.findByPkOrThrow.mockResolvedValue(
        settlement as unknown as SettlementModel,
      )
      await expect(
        service.updateSettlement('settlement-123', updateDto),
      ).rejects.toThrow(BadRequestException)
      await expect(
        service.updateSettlement('settlement-123', updateDto),
      ).rejects.toThrow(
        'Cannot modify settlement - has published/finalized adverts',
      )
      expect(settlement.update).not.toHaveBeenCalled()
    })
    it('should throw BadRequestException when any advert is REJECTED', async () => {
      const settlement = createMockSettlement({
        adverts: [
          createMockAdvert({ statusId: StatusIdEnum.IN_PROGRESS }),
          createMockAdvert({ statusId: StatusIdEnum.REJECTED }),
        ],
      })
      settlementModel.findByPkOrThrow.mockResolvedValue(
        settlement as unknown as SettlementModel,
      )
      await expect(
        service.updateSettlement('settlement-123', updateDto),
      ).rejects.toThrow(BadRequestException)
      expect(settlement.update).not.toHaveBeenCalled()
    })
    it('should throw BadRequestException when any advert is WITHDRAWN', async () => {
      const settlement = createMockSettlement({
        adverts: [
          createMockAdvert({ statusId: StatusIdEnum.READY_FOR_PUBLICATION }),
          createMockAdvert({ statusId: StatusIdEnum.WITHDRAWN }),
        ],
      })
      settlementModel.findByPkOrThrow.mockResolvedValue(
        settlement as unknown as SettlementModel,
      )
      await expect(
        service.updateSettlement('settlement-123', updateDto),
      ).rejects.toThrow(BadRequestException)
      expect(settlement.update).not.toHaveBeenCalled()
    })
    it('should throw when all adverts are in terminal states', async () => {
      const settlement = createMockSettlement({
        adverts: [
          createMockAdvert({ statusId: StatusIdEnum.PUBLISHED }),
          createMockAdvert({ statusId: StatusIdEnum.REJECTED }),
          createMockAdvert({ statusId: StatusIdEnum.WITHDRAWN }),
        ],
      })
      settlementModel.findByPkOrThrow.mockResolvedValue(
        settlement as unknown as SettlementModel,
      )
      await expect(
        service.updateSettlement('settlement-123', updateDto),
      ).rejects.toThrow(BadRequestException)
      expect(settlement.update).not.toHaveBeenCalled()
    })
    it('should include adverts in query with statusId attribute', async () => {
      const settlement = createMockSettlement({ adverts: [] })
      settlementModel.findByPkOrThrow.mockResolvedValue(
        settlement as unknown as SettlementModel,
      )
      await service.updateSettlement('settlement-123', updateDto)
      expect(settlementModel.findByPkOrThrow).toHaveBeenCalledWith(
        'settlement-123',
        expect.objectContaining({
          include: [
            expect.objectContaining({
              model: AdvertModel,
              attributes: ['id', 'statusId'],
            }),
          ],
        }),
      )
    })
    describe('Partial Update Behavior', () => {
      it('should only update fields that are provided in the DTO', async () => {
        const settlement = createMockSettlement({
          liquidatorName: 'Original Liquidator',
          liquidatorLocation: 'Original Location',
          name: 'Original Name',
          nationalId: '1234567890',
          address: 'Original Address',
          adverts: [],
        })
        settlementModel.findByPkOrThrow.mockResolvedValue(
          settlement as unknown as SettlementModel,
        )
        const partialUpdate: UpdateSettlementDto = {
          liquidatorName: 'Updated Liquidator',
        }
        await service.updateSettlement('settlement-123', partialUpdate)
        expect(settlement.update).toHaveBeenCalledWith({
          liquidatorName: 'Updated Liquidator',
        })
        expect(settlement.update).toHaveBeenCalledTimes(1)
      })
      it('should not include undefined fields in the update', async () => {
        const settlement = createMockSettlement({ adverts: [] })
        settlementModel.findByPkOrThrow.mockResolvedValue(
          settlement as unknown as SettlementModel,
        )
        const partialUpdate: UpdateSettlementDto = {
          name: 'New Name',
          address: 'New Address',
        }
        await service.updateSettlement('settlement-123', partialUpdate)
        const updateCall = settlement.update.mock.calls[0][0]
        expect(updateCall).toEqual({
          name: 'New Name',
          address: 'New Address',
        })
        expect(updateCall).not.toHaveProperty('liquidatorName')
        expect(updateCall).not.toHaveProperty('nationalId')
      })
      it('should handle null values for date fields', async () => {
        const settlement = createMockSettlement({
          deadline: new Date('2024-01-01'),
          dateOfDeath: new Date('2023-01-01'),
          adverts: [],
        })
        settlementModel.findByPkOrThrow.mockResolvedValue(
          settlement as unknown as SettlementModel,
        )
        const updateWithNulls: UpdateSettlementDto = {
          deadline: null,
          dateOfDeath: null,
        }
        await service.updateSettlement('settlement-123', updateWithNulls)
        expect(settlement.update).toHaveBeenCalledWith({
          deadline: null,
          dateOfDeath: null,
        })
      })
      it('should keep Date fields as Date objects', async () => {
        const settlement = createMockSettlement({ adverts: [] })
        settlementModel.findByPkOrThrow.mockResolvedValue(
          settlement as unknown as SettlementModel,
        )
        const updateWithDates: UpdateSettlementDto = {
          deadline: new Date('2024-12-31T23:59:59.000Z'),
          dateOfDeath: new Date('2023-06-15T00:00:00.000Z'),
        }
        await service.updateSettlement('settlement-123', updateWithDates)
        const updateCall = settlement.update.mock.calls[0][0]
        expect(updateCall.deadline).toBeInstanceOf(Date)
        expect(updateCall.dateOfDeath).toBeInstanceOf(Date)
        expect(updateCall.deadline?.toISOString()).toBe(
          '2024-12-31T23:59:59.000Z',
        )
        expect(updateCall.dateOfDeath?.toISOString()).toBe(
          '2023-06-15T00:00:00.000Z',
        )
      })
      it('should handle all optional fields correctly', async () => {
        const settlement = createMockSettlement({ adverts: [] })
        settlementModel.findByPkOrThrow.mockResolvedValue(
          settlement as unknown as SettlementModel,
        )
        const fullUpdate: UpdateSettlementDto = {
          liquidatorName: 'New Liquidator',
          liquidatorLocation: 'New Location',
          liquidatorRecallStatementLocation: 'New Statement Location',
          liquidatorRecallStatementType: 'COURTHOUSE' as any,
          name: 'New Name',
          nationalId: '9876543210',
          address: 'New Address',
          deadline: new Date('2024-12-31T23:59:59.000Z'),
          dateOfDeath: new Date('2023-06-15T00:00:00.000Z'),
          declaredClaims: 5,
          type: 'ESTATE' as any,
        }
        await service.updateSettlement('settlement-123', fullUpdate)
        const updateCall = settlement.update.mock.calls[0][0]
        expect(updateCall).toMatchObject({
          liquidatorName: 'New Liquidator',
          liquidatorLocation: 'New Location',
          liquidatorRecallStatementLocation: 'New Statement Location',
          liquidatorRecallStatementType: 'COURTHOUSE',
          name: 'New Name',
          nationalId: '9876543210',
          address: 'New Address',
          declaredClaims: 5,
          type: 'ESTATE',
        })
        expect(updateCall.deadline).toBeInstanceOf(Date)
        expect(updateCall.dateOfDeath).toBeInstanceOf(Date)
      })
      it('should allow updating only declaredClaims', async () => {
        const settlement = createMockSettlement({
          declaredClaims: 10,
          adverts: [],
        })
        settlementModel.findByPkOrThrow.mockResolvedValue(
          settlement as unknown as SettlementModel,
        )
        await service.updateSettlement('settlement-123', { declaredClaims: 15 })
        expect(settlement.update).toHaveBeenCalledWith({
          declaredClaims: 15,
        })
      })
      it('should allow setting declaredClaims to null', async () => {
        const settlement = createMockSettlement({
          declaredClaims: 10,
          adverts: [],
        })
        settlementModel.findByPkOrThrow.mockResolvedValue(
          settlement as unknown as SettlementModel,
        )
        await service.updateSettlement('settlement-123', {
          declaredClaims: null,
        })
        expect(settlement.update).toHaveBeenCalledWith({
          declaredClaims: null,
        })
      })
    })
    describe('Partner Fields (undivided settlement)', () => {
      it('should update partner fields when provided', async () => {
        const settlement = createMockSettlement({ adverts: [] })
        settlementModel.findByPkOrThrow.mockResolvedValue(
          settlement as unknown as SettlementModel,
        )
        const update: UpdateSettlementDto = {
          partnerName: 'Partner Name',
          partnerNationalId: '0987654321',
          partnerDateOfDeath: new Date('2022-03-10T00:00:00.000Z'),
        }
        await service.updateSettlement('settlement-123', update)
        const updateCall = settlement.update.mock.calls[0][0]
        expect(updateCall).toMatchObject({
          partnerName: 'Partner Name',
          partnerNationalId: '0987654321',
        })
        expect(updateCall.partnerDateOfDeath).toBeInstanceOf(Date)
        expect(updateCall.partnerDateOfDeath?.toISOString()).toBe(
          '2022-03-10T00:00:00.000Z',
        )
      })
      it('should allow setting partnerDateOfDeath to null', async () => {
        const settlement = createMockSettlement({
          partnerDateOfDeath: new Date('2022-03-10T00:00:00.000Z'),
          adverts: [],
        })
        settlementModel.findByPkOrThrow.mockResolvedValue(
          settlement as unknown as SettlementModel,
        )
        await service.updateSettlement('settlement-123', {
          partnerDateOfDeath: null,
        })
        expect(settlement.update).toHaveBeenCalledWith({
          partnerDateOfDeath: null,
        })
      })
      it('should allow clearing partner name and national id with null', async () => {
        const settlement = createMockSettlement({
          partnerName: 'Old Partner',
          partnerNationalId: '0987654321',
          adverts: [],
        })
        settlementModel.findByPkOrThrow.mockResolvedValue(
          settlement as unknown as SettlementModel,
        )
        await service.updateSettlement('settlement-123', {
          partnerName: null,
          partnerNationalId: null,
        })
        expect(settlement.update).toHaveBeenCalledWith({
          partnerName: null,
          partnerNationalId: null,
        })
      })
      it('should not include partner fields when undefined', async () => {
        const settlement = createMockSettlement({ adverts: [] })
        settlementModel.findByPkOrThrow.mockResolvedValue(
          settlement as unknown as SettlementModel,
        )
        await service.updateSettlement('settlement-123', { name: 'Only Name' })
        const updateCall = settlement.update.mock.calls[0][0]
        expect(updateCall).not.toHaveProperty('partnerName')
        expect(updateCall).not.toHaveProperty('partnerNationalId')
        expect(updateCall).not.toHaveProperty('partnerDateOfDeath')
      })
    })
  })
})
