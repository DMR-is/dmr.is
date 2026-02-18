import { NotFoundException } from '@nestjs/common'
import { getModelToken } from '@nestjs/sequelize'
import { Test, TestingModule } from '@nestjs/testing'

import { LOGGER_PROVIDER } from '@dmr.is/logging'

import { AdvertModel } from '../../models/advert.model'
import { AdvertPublicationModel } from '../../models/advert-publication.model'
import { PdfService } from '../advert/pdf/pdf.service'
import { PdfAdminService } from './pdf-admin.service'
const mockLogger = {
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}
const ADVERT_ID = '123e4567-e89b-12d3-a456-426614174000'
const PUBLICATION_ID = '123e4567-e89b-12d3-a456-426614174001'
const MOCK_USER = {
  adminUserId: 'admin-user-1',
  nationalId: '1234567890',
}
const MOCK_HTML = '<html><body>Test advert</body></html>'
const MOCK_TITLE = 'Test Advert Title'
const MOCK_S3_URL =
  'https://files.legal-gazette.dev.dmr-dev.cloud/adverts/123/456/advert.pdf'
const createMockPublication = (overrides: Record<string, unknown> = {}) => ({
  id: PUBLICATION_ID,
  advertId: ADVERT_ID,
  versionLetter: 'A',
  advert: {
    htmlMarkup: jest.fn().mockReturnValue(MOCK_HTML),
    title: MOCK_TITLE,
  },
  ...overrides,
})
describe('PdfAdminService', () => {
  let service: PdfAdminService
  let publicationModel: {
    findByPk: jest.Mock
  }
  let pdfService: {
    generatePdfAndSaveToS3: jest.Mock
  }
  beforeEach(async () => {
    // Mock AdvertModel.scope() static method used in service
    jest
      .spyOn(AdvertModel, 'scope')
      .mockReturnValue(AdvertModel as typeof AdvertModel)
    const mockPublicationModel = {
      findByPk: jest.fn(),
    }
    const mockPdfService = {
      generatePdfAndSaveToS3: jest.fn(),
    }
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PdfAdminService,
        {
          provide: getModelToken(AdvertPublicationModel),
          useValue: mockPublicationModel,
        },
        {
          provide: PdfService,
          useValue: mockPdfService,
        },
        {
          provide: LOGGER_PROVIDER,
          useValue: mockLogger,
        },
      ],
    }).compile()
    service = module.get<PdfAdminService>(PdfAdminService)
    publicationModel = mockPublicationModel
    pdfService = mockPdfService
    jest.clearAllMocks()
  })
  describe('regeneratePdf', () => {
    it('should regenerate PDF successfully and return pdfUrl', async () => {
      const mockPublication = createMockPublication()
      publicationModel.findByPk.mockResolvedValue(mockPublication)
      pdfService.generatePdfAndSaveToS3.mockResolvedValue({
        s3Url: MOCK_S3_URL,
        key: 'some-key',
        pdfBuffer: Buffer.from('pdf'),
      })
      const result = await service.regeneratePdf(
        ADVERT_ID,
        PUBLICATION_ID,
        MOCK_USER as any,
      )
      expect(result).toEqual({
        pdfUrl: MOCK_S3_URL,
        message: 'PDF regenerated successfully',
      })
    })
    it('should throw NotFoundException when publication is not found', async () => {
      publicationModel.findByPk.mockResolvedValue(null)
      await expect(
        service.regeneratePdf(ADVERT_ID, PUBLICATION_ID, MOCK_USER as any),
      ).rejects.toThrow(NotFoundException)
      await expect(
        service.regeneratePdf(ADVERT_ID, PUBLICATION_ID, MOCK_USER as any),
      ).rejects.toThrow(`Publication with id ${PUBLICATION_ID} not found`)
    })
    it('should throw NotFoundException when publication does not belong to advert', async () => {
      const wrongAdvertId = 'wrong-advert-id'
      const mockPublication = createMockPublication({
        advertId: wrongAdvertId,
      })
      publicationModel.findByPk.mockResolvedValue(mockPublication)
      await expect(
        service.regeneratePdf(ADVERT_ID, PUBLICATION_ID, MOCK_USER as any),
      ).rejects.toThrow(NotFoundException)
      await expect(
        service.regeneratePdf(ADVERT_ID, PUBLICATION_ID, MOCK_USER as any),
      ).rejects.toThrow(
        `Publication ${PUBLICATION_ID} does not belong to advert ${ADVERT_ID}`,
      )
    })
    it('should call PdfService.generatePdfAndSaveToS3 with correct parameters', async () => {
      const mockPublication = createMockPublication()
      publicationModel.findByPk.mockResolvedValue(mockPublication)
      pdfService.generatePdfAndSaveToS3.mockResolvedValue({
        s3Url: MOCK_S3_URL,
        key: 'some-key',
        pdfBuffer: Buffer.from('pdf'),
      })
      await service.regeneratePdf(ADVERT_ID, PUBLICATION_ID, MOCK_USER as any)
      expect(mockPublication.advert.htmlMarkup).toHaveBeenCalledWith('A')
      expect(pdfService.generatePdfAndSaveToS3).toHaveBeenCalledWith(
        MOCK_HTML,
        ADVERT_ID,
        PUBLICATION_ID,
        MOCK_TITLE,
      )
    })
    it('should log at start and on success', async () => {
      const mockPublication = createMockPublication()
      publicationModel.findByPk.mockResolvedValue(mockPublication)
      pdfService.generatePdfAndSaveToS3.mockResolvedValue({
        s3Url: MOCK_S3_URL,
        key: 'some-key',
        pdfBuffer: Buffer.from('pdf'),
      })
      await service.regeneratePdf(ADVERT_ID, PUBLICATION_ID, MOCK_USER as any)
      expect(mockLogger.info).toHaveBeenCalledTimes(2)
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Regenerating PDF for publication',
        expect.objectContaining({
          context: 'PdfAdminService',
          advertId: ADVERT_ID,
          publicationId: PUBLICATION_ID,
          adminUserId: MOCK_USER.adminUserId,
        }),
      )
      expect(mockLogger.info).toHaveBeenCalledWith(
        'PDF regenerated successfully',
        expect.objectContaining({
          context: 'PdfAdminService',
          advertId: ADVERT_ID,
          publicationId: PUBLICATION_ID,
          adminUserId: MOCK_USER.adminUserId,
          newPdfUrl: MOCK_S3_URL,
        }),
      )
    })
    it('should call findByPk with publicationId and include advert', async () => {
      const mockPublication = createMockPublication()
      publicationModel.findByPk.mockResolvedValue(mockPublication)
      pdfService.generatePdfAndSaveToS3.mockResolvedValue({
        s3Url: MOCK_S3_URL,
        key: 'some-key',
        pdfBuffer: Buffer.from('pdf'),
      })
      await service.regeneratePdf(ADVERT_ID, PUBLICATION_ID, MOCK_USER as any)
      expect(publicationModel.findByPk).toHaveBeenCalledWith(
        PUBLICATION_ID,
        expect.objectContaining({
          include: expect.arrayContaining([
            expect.objectContaining({
              as: 'advert',
            }),
          ]),
        }),
      )
    })
  })
})
