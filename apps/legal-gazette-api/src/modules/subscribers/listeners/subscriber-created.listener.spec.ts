import { Sequelize } from 'sequelize-typescript'

import { getModelToken } from '@nestjs/sequelize'
import { Test, TestingModule } from '@nestjs/testing'

import { SubscriberModel } from '../../../models/subscriber.model'
import { SubscriberPaymentModel } from '../../../models/subscriber-payment.model'
import { ITBRService } from '../../tbr/tbr.service.interface'
import { SubscriberCreatedEvent } from '../events/subscriber-created.event'
import { SubscriberCreatedListener } from './subscriber-created.listener'

// Mock environment variables before importing the listener
const MOCK_ENV = {
  LG_TBR_CHARGE_CATEGORY_PERSON: 'PERSON_CATEGORY',
  LG_TBR_CHARGE_CATEGORY_COMPANY: 'COMPANY_CATEGORY',
  LG_SUBSCRIPTION_FEE_CODE: 'RL401',
  LG_SUBSCRIPTION_AMOUNT: '4500',
}

describe('SubscriberCreatedListener', () => {
  let listener: SubscriberCreatedListener
  let tbrService: jest.Mocked<ITBRService>
  let subscriberPaymentModel: jest.Mocked<typeof SubscriberPaymentModel>
  let subscriberModel: jest.Mocked<typeof SubscriberModel>
  let sequelize: jest.Mocked<Sequelize>

  // Test data factories
  const createMockSubscriber = (overrides = {}) => ({
    id: 'subscriber-123',
    nationalId: '0101801234', // Personal ID (starts with 0-3)
    name: 'Test User',
    email: 'test@example.com',
    isActive: false,
    subscribedFrom: null,
    subscribedTo: null,
    ...overrides,
  })

  const createMockEvent = (overrides = {}): SubscriberCreatedEvent => ({
    subscriber: createMockSubscriber(),
    actorNationalId: '0101801234',
    ...overrides,
  })

  // Transaction mock that executes callback
  const mockTransaction = jest.fn().mockImplementation(async (callback) => {
    const transactionObj = { commit: jest.fn(), rollback: jest.fn() }
    return callback(transactionObj)
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
    // Reset all mocks
    jest.clearAllMocks()

    // Create mock implementations
    const mockTbrService: jest.Mocked<ITBRService> = {
      postPayment: jest.fn().mockResolvedValue(undefined),
      getPaymentStatus: jest.fn(),
    }

    const mockSubscriberPaymentModel = {
      create: jest.fn().mockResolvedValue({}),
    }

    const mockSubscriberModel = {
      findByPk: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue([1]),
    }

    const mockSequelize = {
      transaction: mockTransaction,
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriberCreatedListener,
        {
          provide: ITBRService,
          useValue: mockTbrService,
        },
        {
          provide: getModelToken(SubscriberPaymentModel),
          useValue: mockSubscriberPaymentModel,
        },
        {
          provide: getModelToken(SubscriberModel),
          useValue: mockSubscriberModel,
        },
        {
          provide: Sequelize,
          useValue: mockSequelize,
        },
      ],
    }).compile()

    listener = module.get<SubscriberCreatedListener>(SubscriberCreatedListener)
    tbrService = module.get(ITBRService)
    subscriberPaymentModel = module.get(getModelToken(SubscriberPaymentModel))
    subscriberModel = module.get(getModelToken(SubscriberModel))
    sequelize = module.get(Sequelize)
  })

  // ==========================================
  // TBR Payment Creation Tests
  // ==========================================
  describe('TBR Payment Creation', () => {
    it('should create TBR payment with correct parameters for personal ID', async () => {
      const event = createMockEvent({
        subscriber: createMockSubscriber({ nationalId: '0101801234' }),
      })

      await listener.createSubscriptionPayment(event)

      expect(tbrService.postPayment).toHaveBeenCalledWith({
        advertId: 'subscriber-123',
        chargeCategory: 'PERSON_CATEGORY',
        chargeBase: 'subscriber-123',
        debtorNationalId: '0101801234',
        expenses: [
          {
            feeCode: 'RL401',
            reference: 'Áskrift - 0101801234',
            quantity: 1,
            unitPrice: 4500,
            sum: 4500,
          },
        ],
      })
    })

    it('should create TBR payment with COMPANY_CATEGORY for company ID', async () => {
      const event = createMockEvent({
        subscriber: createMockSubscriber({ nationalId: '5501012345' }), // Company ID (starts with 5)
      })

      await listener.createSubscriptionPayment(event)

      expect(tbrService.postPayment).toHaveBeenCalledWith(
        expect.objectContaining({
          chargeCategory: 'COMPANY_CATEGORY',
          debtorNationalId: '5501012345',
        }),
      )
    })

    it('should throw error when TBR payment fails', async () => {
      const event = createMockEvent()
      const tbrError = new Error('TBR service unavailable')
      tbrService.postPayment.mockRejectedValue(tbrError)

      await expect(listener.createSubscriptionPayment(event)).rejects.toThrow(
        'TBR service unavailable',
      )

      // DB operations should not be called
      expect(sequelize.transaction).not.toHaveBeenCalled()
    })
  })

  // ==========================================
  // Company National ID Detection Tests
  // ==========================================
  describe('isCompanyNationalId', () => {
    it.each([
      ['0101801234', false], // Personal - starts with 0
      ['1501901234', false], // Personal - starts with 1
      ['2901801234', false], // Personal - starts with 2
      ['3101801234', false], // Personal - starts with 3
      ['4501012345', true], // Company - starts with 4
      ['5501012345', true], // Company - starts with 5
      ['6601012345', true], // Company - starts with 6
      ['7701012345', true], // Company - starts with 7
      ['8000000000', true], // Company - starts with 8
      ['9000000000', true], // Company - starts with 9
    ])('nationalId %s should return isCompany=%s', async (nationalId, isCompany) => {
      const event = createMockEvent({
        subscriber: createMockSubscriber({ nationalId }),
      })

      await listener.createSubscriptionPayment(event)

      const expectedCategory = isCompany ? 'COMPANY_CATEGORY' : 'PERSON_CATEGORY'
      expect(tbrService.postPayment).toHaveBeenCalledWith(
        expect.objectContaining({
          chargeCategory: expectedCategory,
        }),
      )
    })

    it('should treat invalid national IDs as personal', async () => {
      const event = createMockEvent({
        subscriber: createMockSubscriber({ nationalId: '12345' }), // Too short
      })

      await listener.createSubscriptionPayment(event)

      expect(tbrService.postPayment).toHaveBeenCalledWith(
        expect.objectContaining({
          chargeCategory: 'PERSON_CATEGORY',
        }),
      )
    })
  })

  // ==========================================
  // Payment Record Creation Tests
  // ==========================================
  describe('Payment Record Creation', () => {
    it('should create payment record with correct data', async () => {
      const event = createMockEvent({
        actorNationalId: '0101809999',
      })

      await listener.createSubscriptionPayment(event)

      expect(subscriberPaymentModel.create).toHaveBeenCalledWith(
        {
          subscriberId: 'subscriber-123',
          activatedByNationalId: '0101809999',
          amount: 4500,
          chargeBase: 'subscriber-123',
          chargeCategory: 'PERSON_CATEGORY',
          feeCode: 'RL401',
          paidAt: null,
        },
        expect.objectContaining({ transaction: expect.anything() }),
      )
    })

    it('should use actorNationalId from event (delegation support)', async () => {
      const event = createMockEvent({
        subscriber: createMockSubscriber({ nationalId: '0101801234' }),
        actorNationalId: '0101809999', // Different from subscriber - delegation
      })

      await listener.createSubscriptionPayment(event)

      expect(subscriberPaymentModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          activatedByNationalId: '0101809999',
        }),
        expect.anything(),
      )
    })
  })

  // ==========================================
  // Subscriber Activation Tests
  // ==========================================
  describe('Subscriber Activation', () => {
    it('should set subscribedFrom for new subscription', async () => {
      const event = createMockEvent()
      subscriberModel.findByPk.mockResolvedValue(null)

      await listener.createSubscriptionPayment(event)

      expect(subscriberModel.update).toHaveBeenCalledWith(
        expect.objectContaining({
          isActive: true,
          subscribedFrom: expect.any(Date),
          subscribedTo: expect.any(Date),
        }),
        expect.objectContaining({
          where: { id: 'subscriber-123' },
          transaction: expect.anything(),
        }),
      )
    })

    it('should NOT update subscribedFrom for renewal', async () => {
      const originalSubscribedFrom = new Date('2024-01-01')
      const event = createMockEvent()
      subscriberModel.findByPk.mockResolvedValue({
        id: 'subscriber-123',
        subscribedFrom: originalSubscribedFrom,
        subscribedTo: new Date('2024-12-31'),
      } as unknown as SubscriberModel)

      await listener.createSubscriptionPayment(event)

      // Check that update was called without subscribedFrom
      const updateCall = subscriberModel.update.mock.calls[0]
      const updateData = updateCall[0] as Record<string, unknown>

      expect(updateData.subscribedFrom).toBeUndefined()
      expect(updateData.isActive).toBe(true)
      expect(updateData.subscribedTo).toBeInstanceOf(Date)
    })

    it('should set subscribedTo to 1 year from now', async () => {
      const event = createMockEvent()
      const now = Date.now()
      jest.spyOn(Date, 'now').mockReturnValue(now)

      await listener.createSubscriptionPayment(event)

      const updateCall = subscriberModel.update.mock.calls[0]
      const updateData = updateCall[0] as Record<string, unknown>
      const subscribedTo = updateData.subscribedTo as Date

      const expectedDate = new Date(now + 365 * 24 * 60 * 60 * 1000)
      expect(subscribedTo.getTime()).toBe(expectedDate.getTime())

      jest.restoreAllMocks()
    })
  })

  // ==========================================
  // Transaction & Error Handling Tests
  // ==========================================
  describe('Transaction Handling', () => {
    it('should wrap DB operations in a transaction', async () => {
      const event = createMockEvent()

      await listener.createSubscriptionPayment(event)

      expect(sequelize.transaction).toHaveBeenCalledTimes(1)
      expect(subscriberPaymentModel.create).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ transaction: expect.anything() }),
      )
      expect(subscriberModel.findByPk).toHaveBeenCalledWith(
        'subscriber-123',
        expect.objectContaining({ transaction: expect.anything() }),
      )
      expect(subscriberModel.update).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ transaction: expect.anything() }),
      )
    })

    it('should throw error when DB operation fails after TBR success', async () => {
      const event = createMockEvent()
      const dbError = new Error('Database connection lost')
      subscriberPaymentModel.create.mockRejectedValue(dbError)

      await expect(listener.createSubscriptionPayment(event)).rejects.toThrow(
        'Database connection lost',
      )

      // TBR should have been called before DB failure
      expect(tbrService.postPayment).toHaveBeenCalled()
    })

    it('should not call DB operations if TBR fails', async () => {
      const event = createMockEvent()
      tbrService.postPayment.mockRejectedValue(new Error('TBR error'))

      await expect(listener.createSubscriptionPayment(event)).rejects.toThrow()

      expect(sequelize.transaction).not.toHaveBeenCalled()
      expect(subscriberPaymentModel.create).not.toHaveBeenCalled()
      expect(subscriberModel.update).not.toHaveBeenCalled()
    })
  })

  // ==========================================
  // Full Flow Integration Tests
  // ==========================================
  describe('Full Payment Flow', () => {
    it('should complete full flow: TBR -> Payment Record -> Activate Subscriber', async () => {
      const event = createMockEvent({
        subscriber: createMockSubscriber({
          id: 'sub-456',
          nationalId: '0101801234',
        }),
        actorNationalId: '0101809999',
      })

      await listener.createSubscriptionPayment(event)

      // Verify order of operations
      expect(tbrService.postPayment).toHaveBeenCalledTimes(1)
      expect(subscriberPaymentModel.create).toHaveBeenCalledTimes(1)
      expect(subscriberModel.findByPk).toHaveBeenCalledTimes(1)
      expect(subscriberModel.update).toHaveBeenCalledTimes(1)

      // Verify TBR called with correct subscriber data
      expect(tbrService.postPayment).toHaveBeenCalledWith(
        expect.objectContaining({
          advertId: 'sub-456',
          debtorNationalId: '0101801234',
        }),
      )

      // Verify payment record has actor national ID
      expect(subscriberPaymentModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          subscriberId: 'sub-456',
          activatedByNationalId: '0101809999',
        }),
        expect.anything(),
      )

      // Verify subscriber is activated
      expect(subscriberModel.update).toHaveBeenCalledWith(
        expect.objectContaining({
          isActive: true,
        }),
        expect.objectContaining({
          where: { id: 'sub-456' },
        }),
      )
    })

    it('should handle renewal flow correctly', async () => {
      const originalDate = new Date('2023-06-15')
      const event = createMockEvent()
      subscriberModel.findByPk.mockResolvedValue({
        id: 'subscriber-123',
        nationalId: '0101801234',
        isActive: true,
        subscribedFrom: originalDate,
        subscribedTo: new Date('2024-06-15'),
      } as unknown as SubscriberModel)

      await listener.createSubscriptionPayment(event)

      // Should create new payment record (renewal)
      expect(subscriberPaymentModel.create).toHaveBeenCalled()

      // Should update subscribedTo but NOT subscribedFrom
      const updateData = subscriberModel.update.mock.calls[0][0] as Record<
        string,
        unknown
      >
      expect(updateData.subscribedFrom).toBeUndefined()
      expect(updateData.subscribedTo).toBeInstanceOf(Date)
      expect(updateData.isActive).toBe(true)
    })
  })
})
