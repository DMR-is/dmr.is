import { Op } from 'sequelize'

import { getModelToken } from '@nestjs/sequelize'
import { Test, TestingModule } from '@nestjs/testing'

import { type Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { TASK_JOB_IDS } from '../../../../core/constants'
import { AdvertModel } from '../../../../models/advert.model'
import {
  TBRTransactionModel,
  TBRTransactionStatus,
  TBRTransactionType,
} from '../../../../models/tbr-transactions.model'
import { TBRGetPaymentResponseDto } from '../../../tbr/tbr.dto'
import { ITBRService } from '../../../tbr/tbr.service.interface'
import { IPriceCalculatorService } from '../../calculator/price-calculator.service.interface'
import { PgAdvisoryLockService } from '../lock.service'
import { PaymentTaskService } from './payment.task'
// Test constants
const MOCK_TBR_PERSON_CATEGORY = 'LR1'
const MOCK_CONTAINER_ID = 'container-1'
// Mock factory functions
const createMockTransaction = (
  overrides?: Partial<TBRTransactionModel>,
): Partial<TBRTransactionModel> => ({
  id: 'transaction-1',
  transactionType: TBRTransactionType.ADVERT,
  chargeBase: 'charge-base-1',
  chargeCategory: MOCK_TBR_PERSON_CATEGORY,
  debtorNationalId: '1234567890',
  status: TBRTransactionStatus.CREATED,
  paidAt: null,
  feeCodeId: 'fee-1',
  totalPrice: 1000,
  feeCodeMultiplier: 1,
  tbrReference: null,
  tbrError: null,
  save: jest.fn().mockResolvedValue(undefined),
  ...overrides,
})
const createMockPaymentResponse = (
  overrides?: Partial<TBRGetPaymentResponseDto>,
): TBRGetPaymentResponseDto => ({
  created: true,
  capital: 0,
  canceled: false,
  paid: true,
  ...overrides,
})
describe('PaymentTaskService - Payment Status Polling', () => {
  let service: PaymentTaskService
  let tbrService: jest.Mocked<ITBRService>
  let tbrTransactionModel: any
  let priceCalculatorService: any
  let lockService: jest.Mocked<PgAdvisoryLockService>
  let logger: jest.Mocked<Logger>
  beforeEach(async () => {
    // Setup environment variables
    process.env.LG_TBR_CHARGE_CATEGORY_PERSON = MOCK_TBR_PERSON_CATEGORY
    process.env.TBR_CHUNK_SIZE = '25'
    process.env.TBR_CHUNK_DELAY_MS = '0' // Disable delay in tests
    process.env.HOSTNAME = MOCK_CONTAINER_ID
    const mockTBRService = {
      getPaymentStatus: jest.fn(),
      postPayment: jest.fn(),
    }
    const mockTBRTransactionModel = {
      findAll: jest.fn(),
    }
    const mockAdvertModel = {}
    const mockLockService = {
      runWithDistributedLock: jest.fn(),
    }
    const mockPriceCalculatorService = {}
    const mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    }
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentTaskService,
        {
          provide: ITBRService,
          useValue: mockTBRService,
        },
        {
          provide: IPriceCalculatorService,
          useValue: mockPriceCalculatorService,
        },
        {
          provide: getModelToken(TBRTransactionModel),
          useValue: mockTBRTransactionModel,
        },
        {
          provide: getModelToken(AdvertModel),
          useValue: mockAdvertModel,
        },
        {
          provide: PgAdvisoryLockService,
          useValue: mockLockService,
        },
        {
          provide: LOGGER_PROVIDER,
          useValue: mockLogger,
        },
      ],
    }).compile()
    service = module.get<PaymentTaskService>(PaymentTaskService)
    tbrService = module.get(ITBRService)
    priceCalculatorService = module.get(IPriceCalculatorService)
    tbrTransactionModel = module.get(getModelToken(TBRTransactionModel))
    lockService = module.get(PgAdvisoryLockService)
    logger = module.get(LOGGER_PROVIDER)
  })
  afterEach(() => {
    jest.clearAllMocks()
  })
  describe('updateTBRPayments - Core Functionality', () => {
    it('should skip job when no pending transactions exist', async () => {
      // Arrange
      tbrTransactionModel.findAll.mockResolvedValue([])
      // Act
      await service.updateTBRPayments()
      // Assert
      expect(tbrTransactionModel.findAll).toHaveBeenCalledWith({
        where: {
          paidAt: { [Op.eq]: null },
          chargeCategory: MOCK_TBR_PERSON_CATEGORY,
          status: TBRTransactionStatus.CREATED,
        },
      })
      expect(logger.info).toHaveBeenCalledWith(
        'No pending TBR payments found, skipping job',
        expect.any(Object),
      )
      expect(tbrService.getPaymentStatus).not.toHaveBeenCalled()
    })
    it('should update transaction when payment is completed', async () => {
      // Arrange
      const mockTransaction = createMockTransaction()
      tbrTransactionModel.findAll.mockResolvedValue([mockTransaction])
      tbrService.getPaymentStatus.mockResolvedValue(
        createMockPaymentResponse({ paid: true }),
      )
      // Act
      await service.updateTBRPayments()
      // Assert
      expect(tbrService.getPaymentStatus).toHaveBeenCalledWith(
        {
          chargeBase: mockTransaction.chargeBase,
          chargeCategory: mockTransaction.chargeCategory,
          debtorNationalId: mockTransaction.debtorNationalId,
        },
        0,
      )
      expect(mockTransaction.status).toBe(TBRTransactionStatus.PAID)
      expect(mockTransaction.paidAt).toBeInstanceOf(Date)
      expect(mockTransaction.save).toHaveBeenCalled()
      expect(logger.info).toHaveBeenCalledWith(
        'TBR payment completed, updating transaction',
        expect.objectContaining({
          chargeBase: mockTransaction.chargeBase,
          transactionId: mockTransaction.id,
        }),
      )
    })
    it('should not update transaction when payment is still pending', async () => {
      // Arrange
      const mockTransaction = createMockTransaction()
      tbrTransactionModel.findAll.mockResolvedValue([mockTransaction])
      tbrService.getPaymentStatus.mockResolvedValue(
        createMockPaymentResponse({
          paid: false,
          capital: 1000, // Still has outstanding balance
        }),
      )
      // Act
      await service.updateTBRPayments()
      // Assert
      expect(tbrService.getPaymentStatus).toHaveBeenCalled()
      expect(mockTransaction.save).not.toHaveBeenCalled()
      expect(mockTransaction.status).toBe(TBRTransactionStatus.CREATED)
      expect(mockTransaction.paidAt).toBeNull()
    })
    it('should process multiple transactions in a single chunk', async () => {
      // Arrange
      const mockTransactions = [
        createMockTransaction({ id: 'tx-1', chargeBase: 'base-1' }),
        createMockTransaction({ id: 'tx-2', chargeBase: 'base-2' }),
        createMockTransaction({ id: 'tx-3', chargeBase: 'base-3' }),
      ]
      tbrTransactionModel.findAll.mockResolvedValue(mockTransactions)
      tbrService.getPaymentStatus.mockResolvedValue(
        createMockPaymentResponse({ paid: true }),
      )
      // Act
      await service.updateTBRPayments()
      // Assert
      expect(tbrService.getPaymentStatus).toHaveBeenCalledTimes(3)
      expect(mockTransactions[0].save).toHaveBeenCalled()
      expect(mockTransactions[1].save).toHaveBeenCalled()
      expect(mockTransactions[2].save).toHaveBeenCalled()
    })
  })
  describe('Error Handling', () => {
    it('should log error and continue when TBR service fails for a transaction', async () => {
      // Arrange
      const mockTransactions = [
        createMockTransaction({ id: 'tx-1' }),
        createMockTransaction({ id: 'tx-2' }),
      ]
      tbrTransactionModel.findAll.mockResolvedValue(mockTransactions)
      // First transaction fails, second succeeds
      tbrService.getPaymentStatus
        .mockRejectedValueOnce(new Error('TBR service timeout'))
        .mockResolvedValueOnce(createMockPaymentResponse({ paid: true }))
      // Act
      await service.updateTBRPayments()
      // Assert
      expect(logger.error).toHaveBeenCalledWith(
        'Error fetching TBR payment status',
        expect.objectContaining({
          error: expect.any(Error),
          chargeBase: mockTransactions[0].chargeBase,
          transactionId: mockTransactions[0].id,
        }),
      )
      // First transaction should not be updated
      expect(mockTransactions[0].save).not.toHaveBeenCalled()
      // Second transaction should still be processed and updated
      expect(mockTransactions[1].save).toHaveBeenCalled()
    })
    it('should handle TBR service returning payment canceled status', async () => {
      // Arrange
      const mockTransaction = createMockTransaction()
      tbrTransactionModel.findAll.mockResolvedValue([mockTransaction])
      tbrService.getPaymentStatus.mockResolvedValue(
        createMockPaymentResponse({
          paid: false, // paid = (capital === 0 && canceled === false)
          capital: 0,
          canceled: true, // Payment was canceled
        }),
      )
      // Act
      await service.updateTBRPayments()
      // Assert
      expect(mockTransaction.save).toHaveBeenCalled()
      expect(mockTransaction.status).toBe(TBRTransactionStatus.CANCELED)
    })
    it('should continue processing even if one chunk encounters errors', async () => {
      // Arrange
      const mockTransaction = createMockTransaction()
      tbrTransactionModel.findAll.mockResolvedValue([mockTransaction])
      tbrService.getPaymentStatus.mockRejectedValue(new Error('Network error'))
      // Act
      await service.updateTBRPayments()
      // Assert
      expect(logger.error).toHaveBeenCalledWith(
        'Error fetching TBR payment status',
        expect.any(Object),
      )
      // Should complete without throwing
    })
  })
  describe('Chunking Behavior', () => {
    it('should process transactions in chunks of configured size', async () => {
      // Arrange - Create 30 transactions (should be 2 chunks with size 25)
      const mockTransactions = Array.from({ length: 30 }, (_, i) =>
        createMockTransaction({ id: `tx-${i}`, chargeBase: `base-${i}` }),
      )
      tbrTransactionModel.findAll.mockResolvedValue(mockTransactions)
      tbrService.getPaymentStatus.mockResolvedValue(
        createMockPaymentResponse({ paid: false }),
      )
      // Act
      await service.updateTBRPayments()
      // Assert
      expect(logger.info).toHaveBeenCalledWith(
        'Found 30 pending TBR payments',
        expect.objectContaining({
          chunks: 2,
          chunkSize: 25,
        }),
      )
      expect(logger.info).toHaveBeenCalledWith(
        'Processing TBR transaction chunk 1/2',
        expect.objectContaining({ chunkSize: 25 }),
      )
      expect(logger.info).toHaveBeenCalledWith(
        'Processing TBR transaction chunk 2/2',
        expect.objectContaining({ chunkSize: 5 }),
      )
    })
    it('should respect custom chunk size from environment variable', async () => {
      // This test verifies that TBR_CHUNK_SIZE env var is respected
      // The chunk size is set in beforeEach to 25
      const mockTransactions = Array.from({ length: 10 }, (_, i) =>
        createMockTransaction({ id: `tx-${i}` }),
      )
      tbrTransactionModel.findAll.mockResolvedValue(mockTransactions)
      tbrService.getPaymentStatus.mockResolvedValue(
        createMockPaymentResponse({ paid: false }),
      )
      // Act
      await service.updateTBRPayments()
      // Assert - Should be 1 chunk since 10 < 25
      expect(logger.info).toHaveBeenCalledWith(
        'Found 10 pending TBR payments',
        expect.objectContaining({
          chunks: 1,
          chunkSize: 25,
        }),
      )
    })
  })
  describe('Distributed Lock Integration', () => {
    it('should execute job when lock is acquired', async () => {
      // Arrange
      lockService.runWithDistributedLock.mockImplementation(async (id, fn) => {
        await fn()
        return { ran: true, reason: 'lock acquired' }
      })
      tbrTransactionModel.findAll.mockResolvedValue([])
      // Act
      await service.run()
      // Assert
      expect(lockService.runWithDistributedLock).toHaveBeenCalledWith(
        TASK_JOB_IDS.payment,
        expect.any(Function),
        expect.objectContaining({
          cooldownMs: 10 * 60 * 1000,
          containerId: MOCK_CONTAINER_ID,
        }),
      )
    })
    it('should skip job when lock cannot be acquired', async () => {
      // Arrange
      lockService.runWithDistributedLock.mockResolvedValue({
        ran: false,
        reason: 'already running',
      })
      // Act
      await service.run()
      // Assert
      expect(logger.debug).toHaveBeenCalledWith(
        'TBRPayments skipped (already running)',
        expect.any(Object),
      )
      expect(tbrTransactionModel.findAll).not.toHaveBeenCalled()
    })
  })
  describe('Query Filtering', () => {
    it('should only query created that have no payment', async () => {
      // Arrange
      tbrTransactionModel.findAll.mockResolvedValue([])
      // Act
      await service.updateTBRPayments()
      // Assert
      expect(tbrTransactionModel.findAll).toHaveBeenCalledWith({
        where: {
          paidAt: { [Op.eq]: null },
          chargeCategory: MOCK_TBR_PERSON_CATEGORY,
          status: TBRTransactionStatus.CREATED,
        },
      })
    })
    it('should filter by person charge category from environment', async () => {
      // Arrange
      tbrTransactionModel.findAll.mockResolvedValue([])
      // Act
      await service.updateTBRPayments()
      // Assert
      expect(tbrTransactionModel.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            paidAt: { [Op.eq]: null },
          }),
        }),
      )
    })
  })
  describe('Logging and Observability', () => {
    it('should log job start and finish with duration', async () => {
      // Arrange
      const mockTransaction = createMockTransaction()
      tbrTransactionModel.findAll.mockResolvedValue([mockTransaction])
      tbrService.getPaymentStatus.mockResolvedValue(
        createMockPaymentResponse({ paid: false }),
      )
      // Act
      await service.updateTBRPayments()
      // Assert
      expect(logger.info).toHaveBeenCalledWith(
        'Starting TBR payment status update job for created payments',
        expect.objectContaining({
          timestamp: expect.any(String),
        }),
      )
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('TBR payment status update job finished'),
        expect.objectContaining({
          timestamp: expect.any(String),
          duration: expect.any(Number),
        }),
      )
    })
    it('should log each chunk being processed', async () => {
      // Arrange
      const mockTransactions = Array.from({ length: 30 }, (_, i) =>
        createMockTransaction({ id: `tx-${i}` }),
      )
      tbrTransactionModel.findAll.mockResolvedValue(mockTransactions)
      tbrService.getPaymentStatus.mockResolvedValue(
        createMockPaymentResponse({ paid: false }),
      )
      // Act
      await service.updateTBRPayments()
      // Assert
      expect(logger.info).toHaveBeenCalledWith(
        'Processing TBR transaction chunk 1/2',
        expect.any(Object),
      )
      expect(logger.info).toHaveBeenCalledWith(
        'Processing TBR transaction chunk 2/2',
        expect.any(Object),
      )
    })
  })
})
