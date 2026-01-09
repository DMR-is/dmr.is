import { BadRequestException } from '@nestjs/common'
import { getModelToken } from '@nestjs/sequelize'
import { Test, TestingModule } from '@nestjs/testing'

import { AdvertModel } from '../../models/advert.model'
import {
  SettlementModel,
  UpdateSettlementDto,
} from '../../models/settlement.model'
import { StatusIdEnum } from '../../models/status.model'
import { SettlementService } from './settlement.service'

// ==========================================
// Mock Factories
// ==========================================

interface MockAdvert {
  id: string
  statusId: StatusIdEnum
}

const createMockAdvert = (
  overrides: Partial<MockAdvert> = {},
): MockAdvert => ({
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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettlementService,
        {
          provide: getModelToken(SettlementModel),
          useValue: mockSettlementModel,
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
      ).rejects.toThrow('Cannot modify settlement - has published/finalized adverts')

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
  })
})
