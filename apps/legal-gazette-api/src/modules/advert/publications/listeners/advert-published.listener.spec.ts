import { Sequelize } from 'sequelize-typescript'

import { getModelToken } from '@nestjs/sequelize'
import { Test, TestingModule } from '@nestjs/testing'

import { LOGGER_PROVIDER } from '@dmr.is/logging'
import { IAWSService } from '@dmr.is/modules'

import { AdvertModel } from '../../../../models/advert.model'
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

    const mockAdvertModel = {
      update: jest.fn().mockResolvedValue([1]),
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
          provide: getModelToken(AdvertModel),
          useValue: mockAdvertModel,
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

  // ==========================================
  // Error Handling and Coordination (H-10)
  // ==========================================
  describe('Error Handling and Coordination (H-10)', () => {
    let pdfService: jest.Mocked<PdfService>
    let sesService: jest.Mocked<IAWSService>
    let logger: any

    beforeEach(() => {
      pdfService = listener['pdfService'] as jest.Mocked<PdfService>
      sesService = listener['sesService'] as jest.Mocked<IAWSService>
      logger = listener['logger']
    })

    describe('PDF generation failures', () => {
      it('should not throw when PDF generation fails', async () => {
        const mockError = new Error('PDF generation timeout')
        pdfService.generatePdfAndSaveToS3.mockRejectedValue(mockError)

        const event = createMockEvent()

        // Should not throw - PDF failure should be caught
        await expect(listener.generatePdf(event)).resolves.not.toThrow()
      })

      it('should log error when PDF generation fails', async () => {
        const mockError = new Error('PDF generation timeout')
        pdfService.generatePdfAndSaveToS3.mockRejectedValue(mockError)

        const event = createMockEvent()
        await listener.generatePdf(event)

        expect(logger.error).toHaveBeenCalledWith(
          'Failed to generate PDF after publication',
          expect.objectContaining({
            error: mockError,
            advertId: event.publication.advertId,
            publicationId: event.publication.id,
          }),
        )
      })

      it('should succeed when PDF generation succeeds', async () => {
        pdfService.generatePdfAndSaveToS3.mockResolvedValue({
          s3Url: 'https://s3.amazonaws.com/bucket/file.pdf',
          key: 'file.pdf',
          pdfBuffer: Buffer.from('mock pdf'),
        })

        const event = createMockEvent()
        await listener.generatePdf(event)

        expect(pdfService.generatePdfAndSaveToS3).toHaveBeenCalledWith(
          event.html,
          event.publication.advertId,
          event.publication.id,
          event.advert.title,
        )
        expect(logger.error).not.toHaveBeenCalled()
      })
    })

    describe('Email sending failures', () => {
      it('should not throw when email sending fails', async () => {
        const mockError = new Error('SES service unavailable')
        sesService.sendMail.mockRejectedValue(mockError)

        const event = createMockEvent()

        // Should not throw - email failure should be caught
        await expect(
          listener.sendEmailNotification(event),
        ).resolves.not.toThrow()
      })

      it('should log error when email sending fails', async () => {
        const mockError = new Error('SES service unavailable')
        sesService.sendMail.mockRejectedValue(mockError)

        const event = createMockEvent()
        await listener.sendEmailNotification(event)

        expect(logger.error).toHaveBeenCalledWith(
          'Failed to send email after publication',
          expect.objectContaining({
            error: mockError,
            advertId: event.advert.id,
            publicationId: event.publication.id,
          }),
        )
      })

      it('should succeed when email sending succeeds', async () => {
        sesService.sendMail.mockResolvedValue(undefined)

        const event = createMockEvent()
        await listener.sendEmailNotification(event)

        expect(sesService.sendMail).toHaveBeenCalledWith(
          expect.objectContaining({
            from: 'Lögbirtingablaðið <noreply@logbirtingablad.is>',
            to: 'test@example.com',
          }),
        )
        expect(logger.error).not.toHaveBeenCalled()
      })

      it('should skip email sending when no communication channels exist', async () => {
        const event = createMockEvent()
        // Override communicationChannels after creation
        ;(event.advert as any).communicationChannels = []

        await listener.sendEmailNotification(event)

        expect(sesService.sendMail).not.toHaveBeenCalled()
        expect(logger.warn).toHaveBeenCalledWith(
          'No emails found for advert, skipping email notification',
          expect.anything(),
        )
      })

      it('should skip email sending when communication channels is null/undefined', async () => {
        const event = createMockEvent()
        // Override communicationChannels after creation
        ;(event.advert as any).communicationChannels = null

        await listener.sendEmailNotification(event)

        expect(sesService.sendMail).not.toHaveBeenCalled()
        expect(logger.warn).toHaveBeenCalledWith(
          'No emails found for advert, skipping email notification',
          expect.anything(),
        )
      })
    })

    describe('Independent failure handling', () => {
      it('should allow PDF to fail without affecting TBR transaction', async () => {
        pdfService.generatePdfAndSaveToS3.mockRejectedValue(
          new Error('PDF timeout'),
        )

        const event = createMockEvent()

        // Both should execute independently
        await Promise.all([
          listener.generatePdf(event),
          listener.createTBRTransaction(event),
        ])

        // PDF should fail gracefully
        expect(logger.error).toHaveBeenCalledWith(
          'Failed to generate PDF after publication',
          expect.anything(),
        )

        // TBR should succeed
        expect(tbrService.postPayment).toHaveBeenCalled()
      })

      it('should allow email to fail without affecting TBR transaction', async () => {
        sesService.sendMail.mockRejectedValue(new Error('SES unavailable'))

        const event = createMockEvent()

        // Both should execute independently
        await Promise.all([
          listener.sendEmailNotification(event),
          listener.createTBRTransaction(event),
        ])

        // Email should fail gracefully
        expect(logger.error).toHaveBeenCalledWith(
          'Failed to send email after publication',
          expect.anything(),
        )

        // TBR should succeed
        expect(tbrService.postPayment).toHaveBeenCalled()
      })
    })
  })
})
