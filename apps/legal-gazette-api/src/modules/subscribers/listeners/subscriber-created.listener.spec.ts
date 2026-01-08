import { Sequelize } from 'sequelize-typescript'

import { getModelToken } from '@nestjs/sequelize'
import { Test, TestingModule } from '@nestjs/testing'

import { FeeCodeModel } from '../../../models/fee-code.model'
import { SubscriberModel } from '../../../models/subscriber.model'
import { SubscriberTransactionModel } from '../../../models/subscriber-transaction.model'
import {
  TBRTransactionModel,
  TBRTransactionStatus,
  TBRTransactionType,
} from '../../../models/tbr-transactions.model'
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
  let tbrTransactionModel: jest.Mocked<typeof TBRTransactionModel>
  let subscriberTransactionModel: jest.Mocked<typeof SubscriberTransactionModel>
  let subscriberModel: jest.Mocked<typeof SubscriberModel>
  let feeCodeModel: jest.Mocked<typeof FeeCodeModel>
  let sequelize: jest.Mocked<Sequelize>

  // Mock fee code for lookup
  const mockFeeCode = {
    id: 'fee-code-uuid-123',
    feeCode: 'RL401',
    amount: 4500,
    description: 'Subscription fee',
  }

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

    // Default mock transaction record with update method for C-4 pattern
    const defaultMockTransactionRecord = {
      id: 'transaction-default',
      update: jest.fn().mockResolvedValue(undefined),
    }

    const mockTbrTransactionModel = {
      create: jest.fn().mockResolvedValue(defaultMockTransactionRecord),
    }

    const mockSubscriberTransactionModel = {
      create: jest.fn().mockResolvedValue({ id: 'sub-transaction-123' }),
      update: jest.fn().mockResolvedValue([1]),
    }

    const mockSubscriberModel = {
      findByPk: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue([1]),
    }

    const mockFeeCodeModel = {
      findOne: jest.fn().mockResolvedValue(mockFeeCode),
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
          provide: getModelToken(TBRTransactionModel),
          useValue: mockTbrTransactionModel,
        },
        {
          provide: getModelToken(SubscriberTransactionModel),
          useValue: mockSubscriberTransactionModel,
        },
        {
          provide: getModelToken(SubscriberModel),
          useValue: mockSubscriberModel,
        },
        {
          provide: getModelToken(FeeCodeModel),
          useValue: mockFeeCodeModel,
        },
        {
          provide: Sequelize,
          useValue: mockSequelize,
        },
      ],
    }).compile()

    listener = module.get<SubscriberCreatedListener>(SubscriberCreatedListener)
    tbrService = module.get(ITBRService)
    tbrTransactionModel = module.get(getModelToken(TBRTransactionModel))
    subscriberTransactionModel = module.get(
      getModelToken(SubscriberTransactionModel),
    )
    subscriberModel = module.get(getModelToken(SubscriberModel))
    feeCodeModel = module.get(getModelToken(FeeCodeModel))
    sequelize = module.get(Sequelize)
  })

  // ==========================================
  // Fee Code Lookup Tests
  // ==========================================
  describe('Fee Code Lookup', () => {
    it('should look up fee code by code string', async () => {
      const event = createMockEvent()

      await listener.createSubscriptionPayment(event)

      expect(feeCodeModel.findOne).toHaveBeenCalledWith({
        where: { feeCode: 'RL401' },
      })
    })

    it('should throw error when fee code is not found', async () => {
      feeCodeModel.findOne.mockResolvedValue(null)
      const event = createMockEvent()

      await expect(listener.createSubscriptionPayment(event)).rejects.toThrow(
        'Fee code RL401 not found',
      )

      // TBR should NOT be called if fee code is not found
      expect(tbrService.postPayment).not.toHaveBeenCalled()
    })
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
        id: 'subscriber-123',
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
      const mockTransactionRecord = {
        id: 'transaction-123',
        update: jest.fn().mockResolvedValue(undefined),
      }
      tbrTransactionModel.create.mockResolvedValue(mockTransactionRecord)
      const event = createMockEvent()
      const tbrError = new Error('TBR service unavailable')
      tbrService.postPayment.mockRejectedValue(tbrError)

      await expect(listener.createSubscriptionPayment(event)).rejects.toThrow(
        'TBR service unavailable',
      )

      // C-4: Transaction record should still be created (with PENDING then FAILED status)
      expect(tbrTransactionModel.create).toHaveBeenCalled()
      expect(mockTransactionRecord.update).toHaveBeenCalledWith(
        expect.objectContaining({ status: TBRTransactionStatus.FAILED }),
        expect.anything(),
      )
    })
  })

  // ==========================================
  // Transaction Record Creation Tests
  // ==========================================
  describe('Transaction Record Creation', () => {
    it('should create TBR transaction record with correct data', async () => {
      const event = createMockEvent({
        actorNationalId: '0101809999',
      })

      await listener.createSubscriptionPayment(event)

      expect(tbrTransactionModel.create).toHaveBeenCalledWith(
        {
          transactionType: TBRTransactionType.SUBSCRIPTION,
          feeCodeId: 'fee-code-uuid-123',
          feeCodeMultiplier: 1,
          totalPrice: 4500,
          chargeBase: 'subscriber-123',
          chargeCategory: 'PERSON_CATEGORY',
          debtorNationalId: '0101801234',
          status: TBRTransactionStatus.PENDING,
        },
        expect.objectContaining({ transaction: expect.anything() }),
      )
    })

    it('should create subscriber-transaction junction record', async () => {
      const mockTransactionRecord = {
        id: 'transaction-456',
        update: jest.fn().mockResolvedValue(undefined),
      }
      tbrTransactionModel.create.mockResolvedValue(mockTransactionRecord)
      const event = createMockEvent({
        subscriber: createMockSubscriber({ id: 'subscriber-789' }),
        actorNationalId: '0101809999',
      })

      await listener.createSubscriptionPayment(event)

      expect(subscriberTransactionModel.create).toHaveBeenCalledWith(
        {
          subscriberId: 'subscriber-789',
          transactionId: 'transaction-456',
          activatedByNationalId: '0101809999',
          isCurrent: true,
        },
        expect.objectContaining({ transaction: expect.anything() }),
      )
    })

    it('should mark previous transactions as not current', async () => {
      const event = createMockEvent({
        subscriber: createMockSubscriber({ id: 'subscriber-789' }),
      })

      await listener.createSubscriptionPayment(event)

      expect(subscriberTransactionModel.update).toHaveBeenCalledWith(
        { isCurrent: false },
        expect.objectContaining({
          where: { subscriberId: 'subscriber-789', isCurrent: true },
          transaction: expect.anything(),
        }),
      )
    })

    it('should use actorNationalId from event (delegation support)', async () => {
      const event = createMockEvent({
        subscriber: createMockSubscriber({ nationalId: '0101801234' }),
        actorNationalId: '0101809999', // Different from subscriber - delegation
      })

      await listener.createSubscriptionPayment(event)

      expect(subscriberTransactionModel.create).toHaveBeenCalledWith(
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
      // 1. Create PENDING transaction record + junction record
      // 2. Update to CREATED after TBR success
      // 3. Activate subscriber
      expect(sequelize.transaction).toHaveBeenCalledTimes(3)
      expect(tbrTransactionModel.create).toHaveBeenCalledWith(
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

    it('should throw error when PENDING transaction record creation fails', async () => {
      const event = createMockEvent()
      const dbError = new Error('Database connection lost')
      tbrTransactionModel.create.mockRejectedValue(dbError)

      await expect(listener.createSubscriptionPayment(event)).rejects.toThrow(
        'Database connection lost',
      )

      // TBR should NOT be called if we can't create the PENDING record
      expect(tbrService.postPayment).not.toHaveBeenCalled()
    })

    it('should create PENDING record and update to FAILED if TBR fails', async () => {
      const mockTransactionRecord = {
        id: 'transaction-123',
        update: jest.fn().mockResolvedValue(undefined),
      }
      tbrTransactionModel.create.mockResolvedValue(mockTransactionRecord)
      const event = createMockEvent()
      tbrService.postPayment.mockRejectedValue(new Error('TBR error'))

      await expect(listener.createSubscriptionPayment(event)).rejects.toThrow()

      // PENDING record should have been created
      expect(tbrTransactionModel.create).toHaveBeenCalled()
      // Transaction should be updated to FAILED
      expect(mockTransactionRecord.update).toHaveBeenCalledWith(
        expect.objectContaining({ status: TBRTransactionStatus.FAILED }),
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
    it('should complete full flow: Fee Lookup -> TBR Transaction -> Junction -> TBR API -> Activate', async () => {
      const mockTransactionRecord = {
        id: 'transaction-456',
        update: jest.fn().mockResolvedValue(undefined),
      }
      tbrTransactionModel.create.mockResolvedValue(mockTransactionRecord)

      const event = createMockEvent({
        subscriber: createMockSubscriber({
          id: 'sub-456',
          nationalId: '0101801234',
        }),
        actorNationalId: '0101809999',
      })

      await listener.createSubscriptionPayment(event)

      // Verify order of operations
      expect(feeCodeModel.findOne).toHaveBeenCalledTimes(1)
      expect(tbrTransactionModel.create).toHaveBeenCalledTimes(1)
      expect(subscriberTransactionModel.create).toHaveBeenCalledTimes(1)
      expect(tbrService.postPayment).toHaveBeenCalledTimes(1)
      expect(subscriberModel.findByPk).toHaveBeenCalledTimes(1)
      expect(subscriberModel.update).toHaveBeenCalledTimes(1)

      // Verify TBR called with correct subscriber data
      expect(tbrService.postPayment).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'sub-456',
          debtorNationalId: '0101801234',
        }),
      )

      // Verify TBR transaction record has correct data
      expect(tbrTransactionModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          transactionType: TBRTransactionType.SUBSCRIPTION,
          feeCodeId: 'fee-code-uuid-123',
          debtorNationalId: '0101801234',
          status: TBRTransactionStatus.PENDING,
        }),
        expect.anything(),
      )

      // Verify junction record links subscriber to transaction
      expect(subscriberTransactionModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          subscriberId: 'sub-456',
          transactionId: 'transaction-456',
          activatedByNationalId: '0101809999',
          isCurrent: true,
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

      // Should create new TBR transaction record (renewal)
      expect(tbrTransactionModel.create).toHaveBeenCalled()

      // Should create new junction record
      expect(subscriberTransactionModel.create).toHaveBeenCalled()

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
    describe('transaction record creation order', () => {
      it('should create PENDING transaction record BEFORE calling TBR API', async () => {
        const callOrder: string[] = []

        // Track call order
        tbrTransactionModel.create.mockImplementation(async () => {
          callOrder.push('create_transaction')
          return { id: 'transaction-123', update: jest.fn() }
        })
        tbrService.postPayment.mockImplementation(async () => {
          callOrder.push('call_tbr')
          return undefined
        })

        const event = createMockEvent()
        await listener.createSubscriptionPayment(event)

        // Transaction record should be created BEFORE TBR call
        expect(callOrder).toEqual(['create_transaction', 'call_tbr'])
      })

      it('should create transaction record with PENDING status initially', async () => {
        const event = createMockEvent()
        await listener.createSubscriptionPayment(event)

        expect(tbrTransactionModel.create).toHaveBeenCalledWith(
          expect.objectContaining({
            status: TBRTransactionStatus.PENDING,
          }),
          expect.anything(),
        )
      })
    })

    describe('successful TBR call', () => {
      it('should update transaction record to CREATED after successful TBR call', async () => {
        const mockTransactionRecord = {
          id: 'transaction-123',
          update: jest.fn().mockResolvedValue(undefined),
        }
        tbrTransactionModel.create.mockResolvedValue(mockTransactionRecord)
        tbrService.postPayment.mockResolvedValue(undefined)

        const event = createMockEvent()
        await listener.createSubscriptionPayment(event)

        expect(mockTransactionRecord.update).toHaveBeenCalledWith(
          expect.objectContaining({
            status: TBRTransactionStatus.CREATED,
          }),
          expect.anything(),
        )
      })
    })

    describe('TBR call failure', () => {
      it('should update transaction record to FAILED when TBR call fails', async () => {
        const mockTransactionRecord = {
          id: 'transaction-123',
          update: jest.fn().mockResolvedValue(undefined),
        }
        tbrTransactionModel.create.mockResolvedValue(mockTransactionRecord)
        tbrService.postPayment.mockRejectedValue(new Error('TBR API error'))

        const event = createMockEvent()

        await expect(listener.createSubscriptionPayment(event)).rejects.toThrow(
          'TBR API error',
        )

        expect(mockTransactionRecord.update).toHaveBeenCalledWith(
          expect.objectContaining({
            status: TBRTransactionStatus.FAILED,
            tbrError: 'TBR API error',
          }),
          expect.anything(),
        )
      })

      it('should NOT activate subscriber when TBR call fails', async () => {
        const mockTransactionRecord = {
          id: 'transaction-123',
          update: jest.fn().mockResolvedValue(undefined),
        }
        tbrTransactionModel.create.mockResolvedValue(mockTransactionRecord)
        tbrService.postPayment.mockRejectedValue(new Error('TBR API error'))

        const event = createMockEvent()

        await expect(listener.createSubscriptionPayment(event)).rejects.toThrow()

        // Subscriber should NOT be updated when TBR fails
        expect(subscriberModel.update).not.toHaveBeenCalled()
      })
    })

    describe('database failure after TBR success', () => {
      it('should have transaction record with CREATED status even if subscriber update fails', async () => {
        const mockTransactionRecord = {
          id: 'transaction-123',
          update: jest.fn().mockResolvedValue(undefined),
        }
        tbrTransactionModel.create.mockResolvedValue(mockTransactionRecord)
        tbrService.postPayment.mockResolvedValue(undefined)
        subscriberModel.update.mockRejectedValue(new Error('DB error'))

        const event = createMockEvent()

        // The operation will fail due to subscriber update
        await expect(listener.createSubscriptionPayment(event)).rejects.toThrow(
          'DB error',
        )

        // But the transaction record should have been updated to CREATED first
        // This ensures we have a record of the TBR payment even if activation fails
        expect(mockTransactionRecord.update).toHaveBeenCalledWith(
          expect.objectContaining({
            status: TBRTransactionStatus.CREATED,
          }),
          expect.anything(),
        )
      })
    })
  })
})

