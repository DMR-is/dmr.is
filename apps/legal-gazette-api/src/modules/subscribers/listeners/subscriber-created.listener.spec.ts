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

    // Default mock payment record with update method for C-4 pattern
    const defaultMockPaymentRecord = {
      id: 'payment-default',
      update: jest.fn().mockResolvedValue(undefined),
    }

    const mockSubscriberPaymentModel = {
      create: jest.fn().mockResolvedValue(defaultMockPaymentRecord),
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
        // eslint-disable-next-line local-rules/disallow-kennitalas
        subscriber: createMockSubscriber({ nationalId: '5402696029' }), // Company ID (starts with 5)
      })

      await listener.createSubscriptionPayment(event)

      expect(tbrService.postPayment).toHaveBeenCalledWith(
        expect.objectContaining({
          chargeCategory: 'COMPANY_CATEGORY',
          // eslint-disable-next-line local-rules/disallow-kennitalas
          debtorNationalId: '5402696029',
        }),
      )
    })

    it('should throw error when TBR payment fails', async () => {
      const mockPaymentRecord = {
        id: 'payment-123',
        update: jest.fn().mockResolvedValue(undefined),
      }
      subscriberPaymentModel.create.mockResolvedValue(mockPaymentRecord)
      const event = createMockEvent()
      const tbrError = new Error('TBR service unavailable')
      tbrService.postPayment.mockRejectedValue(tbrError)

      await expect(listener.createSubscriptionPayment(event)).rejects.toThrow(
        'TBR service unavailable',
      )

      // C-4: Payment record should still be created (with PENDING then FAILED status)
      expect(subscriberPaymentModel.create).toHaveBeenCalled()
      expect(mockPaymentRecord.update).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'FAILED' }),
        expect.anything(),
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
          status: 'PENDING', // C-4: Now includes status field
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
    it('should wrap DB operations in transactions', async () => {
      const event = createMockEvent()

      await listener.createSubscriptionPayment(event)

      // C-4 pattern: 3 transactions
      // 1. Create PENDING payment record
      // 2. Update to CONFIRMED after TBR success
      // 3. Activate subscriber
      expect(sequelize.transaction).toHaveBeenCalledTimes(3)
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

    it('should throw error when PENDING payment record creation fails', async () => {
      const event = createMockEvent()
      const dbError = new Error('Database connection lost')
      subscriberPaymentModel.create.mockRejectedValue(dbError)

      await expect(listener.createSubscriptionPayment(event)).rejects.toThrow(
        'Database connection lost',
      )

      // TBR should NOT be called if we can't create the PENDING record
      expect(tbrService.postPayment).not.toHaveBeenCalled()
    })

    it('should create PENDING record and update to FAILED if TBR fails', async () => {
      const mockPaymentRecord = {
        id: 'payment-123',
        update: jest.fn().mockResolvedValue(undefined),
      }
      subscriberPaymentModel.create.mockResolvedValue(mockPaymentRecord)
      const event = createMockEvent()
      tbrService.postPayment.mockRejectedValue(new Error('TBR error'))

      await expect(listener.createSubscriptionPayment(event)).rejects.toThrow()

      // PENDING record should have been created
      expect(subscriberPaymentModel.create).toHaveBeenCalled()
      // Payment should be updated to FAILED
      expect(mockPaymentRecord.update).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'FAILED' }),
        expect.anything(),
      )
      // Subscriber should NOT be activated
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

  // ==========================================
  // C-4: Orphaned TBR Claims Prevention Tests
  // ==========================================
  describe('Orphaned TBR Claims Prevention (C-4)', () => {
    describe('payment record creation order', () => {
      it('should create PENDING payment record BEFORE calling TBR API', async () => {
        const callOrder: string[] = []

        // Track call order
        subscriberPaymentModel.create.mockImplementation(async () => {
          callOrder.push('create_payment')
          return { id: 'payment-123', update: jest.fn() }
        })
        tbrService.postPayment.mockImplementation(async () => {
          callOrder.push('call_tbr')
          return undefined
        })

        const event = createMockEvent()
        await listener.createSubscriptionPayment(event)

        // Payment record should be created BEFORE TBR call
        expect(callOrder).toEqual(['create_payment', 'call_tbr'])
      })

      it('should create payment record with PENDING status initially', async () => {
        const event = createMockEvent()
        await listener.createSubscriptionPayment(event)

        expect(subscriberPaymentModel.create).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 'PENDING',
          }),
          expect.anything(),
        )
      })
    })

    describe('successful TBR call', () => {
      it('should update payment record to CONFIRMED after successful TBR call', async () => {
        const mockPaymentRecord = {
          id: 'payment-123',
          update: jest.fn().mockResolvedValue(undefined),
        }
        subscriberPaymentModel.create.mockResolvedValue(mockPaymentRecord)
        tbrService.postPayment.mockResolvedValue(undefined)

        const event = createMockEvent()
        await listener.createSubscriptionPayment(event)

        expect(mockPaymentRecord.update).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 'CONFIRMED',
          }),
          expect.anything(),
        )
      })
    })

    describe('TBR call failure', () => {
      it('should update payment record to FAILED when TBR call fails', async () => {
        const mockPaymentRecord = {
          id: 'payment-123',
          update: jest.fn().mockResolvedValue(undefined),
        }
        subscriberPaymentModel.create.mockResolvedValue(mockPaymentRecord)
        tbrService.postPayment.mockRejectedValue(new Error('TBR API error'))

        const event = createMockEvent()

        await expect(listener.createSubscriptionPayment(event)).rejects.toThrow(
          'TBR API error',
        )

        expect(mockPaymentRecord.update).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 'FAILED',
            tbrError: 'TBR API error',
          }),
          expect.anything(),
        )
      })

      it('should NOT activate subscriber when TBR call fails', async () => {
        const mockPaymentRecord = {
          id: 'payment-123',
          update: jest.fn().mockResolvedValue(undefined),
        }
        subscriberPaymentModel.create.mockResolvedValue(mockPaymentRecord)
        tbrService.postPayment.mockRejectedValue(new Error('TBR API error'))

        const event = createMockEvent()

        await expect(listener.createSubscriptionPayment(event)).rejects.toThrow()

        // Subscriber should NOT be updated when TBR fails
        expect(subscriberModel.update).not.toHaveBeenCalled()
      })
    })

    describe('database failure after TBR success', () => {
      it('should have payment record with CONFIRMED status even if subscriber update fails', async () => {
        const mockPaymentRecord = {
          id: 'payment-123',
          update: jest.fn().mockResolvedValue(undefined),
        }
        subscriberPaymentModel.create.mockResolvedValue(mockPaymentRecord)
        tbrService.postPayment.mockResolvedValue(undefined)
        subscriberModel.update.mockRejectedValue(new Error('DB error'))

        const event = createMockEvent()

        // The operation will fail due to subscriber update
        await expect(listener.createSubscriptionPayment(event)).rejects.toThrow('DB error')

        // But the payment record should have been updated to CONFIRMED first
        // This ensures we have a record of the TBR payment even if activation fails
        expect(mockPaymentRecord.update).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 'CONFIRMED',
          }),
          expect.anything(),
        )
      })
    })
  })
})

