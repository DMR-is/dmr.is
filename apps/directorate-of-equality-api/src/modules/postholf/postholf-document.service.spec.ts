import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common'
import { getModelToken } from '@nestjs/sequelize'
import { Test } from '@nestjs/testing'

import { LOGGER_PROVIDER } from '@dmr.is/logging'

import { CompanyModel } from '../company/models/company.model'
import {
  CompanyEventTypeEnum,
  CompanyReminderTierEnum,
} from '../company/models/company-event.model'
import { ICompanyEventService } from '../company-event/company-event.service.interface'
import { ReportTypeEnum } from '../report/models/report.enums'
import { buildNoticeDocumentId } from './lib/document-id'
import { INoticeStoreService } from './notice-store.service.interface'
import { PostholfDocumentService } from './postholf-document.service'

const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

// Not real kennitalas — `disallow-kennitalas` forbids valid ones in source.
const NATIONAL_ID = '5501234567'
const OTHER_NATIONAL_ID = '5509876543'
const SECRET = 'test-secret'
const DUE = new Date('2026-05-01T00:00:00.000Z')

const DOCUMENT_ID = buildNoticeDocumentId({
  nationalId: NATIONAL_ID,
  reportType: ReportTypeEnum.EQUALITY,
  tier: CompanyReminderTierEnum.OVERDUE_NOTICE,
  dueDate: DUE,
  secret: SECRET,
})

describe('PostholfDocumentService', () => {
  let service: PostholfDocumentService
  let findOne: jest.Mock
  let hasDeadlineReminderEventOnDate: jest.Mock
  let getNotice: jest.Mock

  beforeEach(async () => {
    jest.clearAllMocks()
    process.env.POSTHOLF_DOCUMENT_ID_SECRET = SECRET

    findOne = jest.fn().mockResolvedValue({ id: 'company-1' })
    hasDeadlineReminderEventOnDate = jest.fn().mockResolvedValue(true)
    getNotice = jest.fn().mockResolvedValue(Buffer.from('a pdf'))

    const module = await Test.createTestingModule({
      providers: [
        PostholfDocumentService,
        { provide: LOGGER_PROVIDER, useValue: mockLogger },
        { provide: getModelToken(CompanyModel), useValue: { findOne } },
        {
          provide: ICompanyEventService,
          useValue: { hasDeadlineReminderEventOnDate },
        },
        { provide: INoticeStoreService, useValue: { get: getNotice } },
      ],
    }).compile()

    service = module.get(PostholfDocumentService)
  })

  afterEach(() => {
    delete process.env.POSTHOLF_DOCUMENT_ID_SECRET
  })

  describe('the happy path', () => {
    it('returns the stored notice as base64', async () => {
      const result = await service.getDocument(NATIONAL_ID, DOCUMENT_ID, true)

      expect(result).toEqual({
        type: 'pdf',
        content: Buffer.from('a pdf').toString('base64'),
        actions: [],
      })
    })

    it('authorises against the issuance event for the decoded kind, tier and date', async () => {
      await service.getDocument(NATIONAL_ID, DOCUMENT_ID, true)

      expect(hasDeadlineReminderEventOnDate).toHaveBeenCalledWith(
        'company-1',
        CompanyEventTypeEnum.EQUALITY_MAILBOX_NOTICE_SENT,
        CompanyReminderTierEnum.OVERDUE_NOTICE,
        '2026-05-01',
      )
    })

    it('uses the salary event type for a salary notice', async () => {
      const salaryId = buildNoticeDocumentId({
        nationalId: NATIONAL_ID,
        reportType: ReportTypeEnum.SALARY,
        tier: CompanyReminderTierEnum.FINES_PRECURSOR,
        dueDate: DUE,
        secret: SECRET,
      })

      await service.getDocument(NATIONAL_ID, salaryId, true)

      expect(hasDeadlineReminderEventOnDate).toHaveBeenCalledWith(
        'company-1',
        CompanyEventTypeEnum.SALARY_MAILBOX_NOTICE_SENT,
        CompanyReminderTierEnum.FINES_PRECURSOR,
        '2026-05-01',
      )
    })

    it('logs the request with the nationalId, documentId and a timestamp', async () => {
      await service.getDocument(NATIONAL_ID, DOCUMENT_ID, true)

      // Required by the Pósthólf security checklist.
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Skjalaveita document request',
        expect.objectContaining({
          nationalId: NATIONAL_ID,
          documentId: DOCUMENT_ID,
          requestedAt: expect.any(String),
        }),
      )
    })
  })

  describe('includeDocument=false', () => {
    it('answers with metadata only and never touches storage', async () => {
      const result = await service.getDocument(NATIONAL_ID, DOCUMENT_ID, false)

      expect(result).toEqual({ type: 'pdf', content: '', actions: [] })
      expect(getNotice).not.toHaveBeenCalled()
    })

    it('still authorises the request', async () => {
      hasDeadlineReminderEventOnDate.mockResolvedValue(false)

      await expect(
        service.getDocument(NATIONAL_ID, DOCUMENT_ID, false),
      ).rejects.toThrow(NotFoundException)
    })
  })

  describe('authorisation', () => {
    it('rejects a malformed documentId as a bad request', async () => {
      await expect(
        service.getDocument(NATIONAL_ID, 'not-ours', true),
      ).rejects.toThrow(BadRequestException)

      expect(findOne).not.toHaveBeenCalled()
    })

    it('rejects a documentId minted for another company, before any lookup', async () => {
      // The checklist's core rule: never serve on the strength of the documentId
      // alone. The id is well-formed here — only the kennitala disagrees.
      await expect(
        service.getDocument(OTHER_NATIONAL_ID, DOCUMENT_ID, true),
      ).rejects.toThrow(NotFoundException)

      expect(findOne).not.toHaveBeenCalled()
      expect(getNotice).not.toHaveBeenCalled()
    })

    it('rejects when the company is unknown', async () => {
      findOne.mockResolvedValue(null)

      await expect(
        service.getDocument(NATIONAL_ID, DOCUMENT_ID, true),
      ).rejects.toThrow(NotFoundException)

      expect(getNotice).not.toHaveBeenCalled()
    })

    it('rejects a well-formed id for a notice that was never issued', async () => {
      hasDeadlineReminderEventOnDate.mockResolvedValue(false)

      await expect(
        service.getDocument(NATIONAL_ID, DOCUMENT_ID, true),
      ).rejects.toThrow(NotFoundException)

      expect(getNotice).not.toHaveBeenCalled()
    })

    it('answers identically whether the company is unknown or the notice was never issued', async () => {
      const unknownCompany = await service
        .getDocument(NATIONAL_ID, DOCUMENT_ID, true)
        .catch((e) => e)
      findOne.mockResolvedValue(null)
      const neverIssued = await service
        .getDocument(NATIONAL_ID, DOCUMENT_ID, true)
        .catch((e) => e)

      // Distinguishing the two would turn this endpoint into an oracle for which
      // companies have been served a legal notice.
      hasDeadlineReminderEventOnDate.mockResolvedValue(false)
      findOne.mockResolvedValue({ id: 'company-1' })
      const notIssued = await service
        .getDocument(NATIONAL_ID, DOCUMENT_ID, true)
        .catch((e) => e)

      expect(unknownCompany).not.toBeInstanceOf(Error)
      expect(neverIssued.message).toBe(notIssued.message)
      expect(neverIssued.getStatus()).toBe(notIssued.getStatus())
    })

    it('refuses to answer at all without POSTHOLF_DOCUMENT_ID_SECRET', async () => {
      delete process.env.POSTHOLF_DOCUMENT_ID_SECRET

      // Without the secret, ownership cannot be verified — so this must fail
      // loudly rather than degrade to serving on the documentId alone.
      await expect(
        service.getDocument(NATIONAL_ID, DOCUMENT_ID, true),
      ).rejects.toThrow(InternalServerErrorException)
    })
  })

  describe('storage', () => {
    it('answers 404 when an issued notice is missing from storage', async () => {
      getNotice.mockResolvedValue(null)

      await expect(
        service.getDocument(NATIONAL_ID, DOCUMENT_ID, true),
      ).rejects.toThrow(NotFoundException)

      // Our fault, not the caller's — so it is logged as an error even though the
      // response is a 404.
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Notice was issued but its stored document is missing',
        expect.objectContaining({ documentId: DOCUMENT_ID }),
      )
    })
  })
})
