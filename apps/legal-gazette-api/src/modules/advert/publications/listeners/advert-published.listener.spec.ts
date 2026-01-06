import { Sequelize } from 'sequelize-typescript'

import { getModelToken } from '@nestjs/sequelize'
import { Test, TestingModule } from '@nestjs/testing'

import { LOGGER_PROVIDER } from '@dmr.is/logging'
import { IAWSService } from '@dmr.is/modules'

import { AdvertVersionEnum } from '../../../../models/advert-publication.model'
import {
  TBRTransactionModel,
  TBRTransactionStatus,
} from '../../../../models/tbr-transactions.model'
import { ITBRService } from '../../../tbr/tbr.service.interface'
import { IPriceCalculatorService } from '../../calculator/price-calculator.service.interface'
import { PdfService } from '../../pdf/pdf.service'
import { AdvertPublishedEvent } from '../events/advert-published.event'
import { AdvertPublishedListener } from './advert-published.listener'

describe('AdvertPublishedListener', () => {
  let listener: AdvertPublishedListener
  let tbrService: jest.Mocked<ITBRService>
  let tbrTransactionModel: jest.Mocked<typeof TBRTransactionModel>
  let priceCalculatorService: jest.Mocked<IPriceCalculatorService>
  let _sequelize: jest.Mocked<Sequelize>

  // Test data factories - use Partial to avoid needing all fields
  const createMockAdvert = (overrides = {}) => ({
    id: 'advert-123',
    title: 'Test Advert',
    publicationNumber: 'LB-001/2024',
    type: { title: 'Skipti' },
    createdByNationalId: '0101801234',
    communicationChannels: [{ email: 'test@example.com' }],
    ...overrides,
  })

  const createMockPublication = (overrides = {}) => ({
    id: 'publication-123',
    advertId: 'advert-123',
    version: AdvertVersionEnum.A,
    ...overrides,
  })

  // Use type assertion with unknown to avoid strict type checking for test mocks
  const createMockEvent = (overrides: Partial<AdvertPublishedEvent> = {}): AdvertPublishedEvent => {
    return {
      advert: createMockAdvert(overrides.advert || {}),
      publication: createMockPublication(overrides.publication || {}),
      html: '<html><body>Test</body></html>',
      ...overrides,
    } as unknown as AdvertPublishedEvent
  }

  const createMockPaymentData = (overrides = {}) => ({
    feeCodeId: 'fee-code-123',
    paymentData: {
      advertId: 'advert-123',
      chargeCategory: 'LEGAL_ENTITY',
      chargeBase: 'advert-123',
      debtorNationalId: '0101801234',
      expenses: [
        {
          feeCode: 'LB100',
          reference: 'Test reference',
          quantity: 1,
          unitPrice: 5000,
          sum: 5000,
        },
      ],
      ...overrides,
    },
  })

  // Transaction mock that executes callback
  const mockTransaction = jest.fn().mockImplementation(async (callback) => {
    const transactionObj = { commit: jest.fn(), rollback: jest.fn() }
    return callback(transactionObj)
  })

  beforeEach(async () => {
    jest.clearAllMocks()

    // Default mock TBR transaction record with update method for C-5 pattern
    const defaultMockTransactionRecord = {
      id: 'transaction-default',
      update: jest.fn().mockResolvedValue(undefined),
    }

    const mockTbrService: jest.Mocked<ITBRService> = {
      postPayment: jest.fn().mockResolvedValue(undefined),
      getPaymentStatus: jest.fn(),
    }

    const mockTbrTransactionModel = {
      create: jest.fn().mockResolvedValue(defaultMockTransactionRecord),
    }

    const mockPriceCalculatorService = {
      getPaymentData: jest.fn().mockResolvedValue(createMockPaymentData()),
    }

    const mockSequelize = {
      transaction: mockTransaction,
    }

    const mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    }

    const mockAWSService = {
      sendMail: jest.fn().mockResolvedValue(undefined),
    }

    const mockPdfService = {
      generatePdfAndSaveToS3: jest.fn().mockResolvedValue(undefined),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdvertPublishedListener,
        {
          provide: ITBRService,
          useValue: mockTbrService,
        },
        {
          provide: getModelToken(TBRTransactionModel),
          useValue: mockTbrTransactionModel,
        },
        {
          provide: IPriceCalculatorService,
          useValue: mockPriceCalculatorService,
        },
        {
          provide: Sequelize,
          useValue: mockSequelize,
        },
        {
          provide: LOGGER_PROVIDER,
          useValue: mockLogger,
        },
        {
          provide: IAWSService,
          useValue: mockAWSService,
        },
        {
          provide: PdfService,
          useValue: mockPdfService,
        },
      ],
    }).compile()

    listener = module.get<AdvertPublishedListener>(AdvertPublishedListener)
    tbrService = module.get(ITBRService)
    tbrTransactionModel = module.get(getModelToken(TBRTransactionModel))
    priceCalculatorService = module.get(IPriceCalculatorService)
    _sequelize = module.get(Sequelize)
  })

  // ==========================================
  // Basic TBR Transaction Tests
  // ==========================================
  describe('TBR Transaction Creation', () => {
    it('should only create TBR transaction for version A publications', async () => {
      const event = createMockEvent()
      // Override publication version
      ;(event.publication as { version: AdvertVersionEnum }).version =
        AdvertVersionEnum.B

      await listener.createTBRTransaction(event)

      expect(tbrService.postPayment).not.toHaveBeenCalled()
      expect(tbrTransactionModel.create).not.toHaveBeenCalled()
    })

    it('should skip TBR transaction if no expenses found', async () => {
      priceCalculatorService.getPaymentData.mockResolvedValue({
        feeCodeId: 'fee-code-123',
        paymentData: {
          advertId: 'advert-123',
          chargeCategory: 'LEGAL_ENTITY',
          chargeBase: 'advert-123',
          debtorNationalId: '0101801234',
          expenses: [], // No expenses
        },
      })

      const event = createMockEvent()
      await listener.createTBRTransaction(event)

      expect(tbrService.postPayment).not.toHaveBeenCalled()
    })

    it('should call TBR with correct payment data', async () => {
      const event = createMockEvent()
      await listener.createTBRTransaction(event)

      expect(tbrService.postPayment).toHaveBeenCalledWith(
        expect.objectContaining({
          chargeCategory: 'LEGAL_ENTITY',
          chargeBase: 'advert-123',
        }),
      )
    })
  })

  // ==========================================
  // Orphaned TBR Claims Prevention (C-5)
  // ==========================================
  describe('Orphaned TBR Claims Prevention (C-5)', () => {
    describe('transaction record creation order', () => {
      it('should create PENDING transaction record BEFORE calling TBR API', async () => {
        const callOrder: string[] = []

        tbrTransactionModel.create.mockImplementation(async () => {
          callOrder.push('create_transaction')
          return {
            id: 'transaction-123',
            update: jest.fn().mockResolvedValue(undefined),
          }
        })

        tbrService.postPayment.mockImplementation(async () => {
          callOrder.push('call_tbr')
          return undefined
        })

        const event = createMockEvent()
        await listener.createTBRTransaction(event)

        // Transaction record should be created BEFORE TBR call
        expect(callOrder).toEqual(['create_transaction', 'call_tbr'])
      })

      it('should create transaction record with PENDING status initially', async () => {
        const event = createMockEvent()
        await listener.createTBRTransaction(event)

        expect(tbrTransactionModel.create).toHaveBeenCalledWith(
          expect.objectContaining({
            status: TBRTransactionStatus.PENDING,
          }),
          expect.anything(),
        )
      })
    })

    describe('successful TBR call', () => {
      it('should update transaction record to CONFIRMED after successful TBR call', async () => {
        const mockTransactionRecord = {
          id: 'transaction-123',
          update: jest.fn().mockResolvedValue(undefined),
        }
        tbrTransactionModel.create.mockResolvedValue(mockTransactionRecord)
        tbrService.postPayment.mockResolvedValue(undefined)

        const event = createMockEvent()
        await listener.createTBRTransaction(event)

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

        await expect(listener.createTBRTransaction(event)).rejects.toThrow(
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
    })

    describe('PENDING record creation failure', () => {
      it('should NOT call TBR if PENDING record creation fails', async () => {
        tbrTransactionModel.create.mockRejectedValue(
          new Error('Database connection lost'),
        )

        const event = createMockEvent()

        await expect(listener.createTBRTransaction(event)).rejects.toThrow(
          'Database connection lost',
        )

        // TBR should NOT be called if we can't create the PENDING record
        expect(tbrService.postPayment).not.toHaveBeenCalled()
      })
    })
  })
})
