import {
  BadRequestException,
  HttpStatus,
  ServiceUnavailableException,
} from '@nestjs/common'
import { getModelToken } from '@nestjs/sequelize'
import { Test } from '@nestjs/testing'

import { LOGGER_PROVIDER } from '@dmr.is/logging'

import {
  IImportUploadService,
  ImportUploadBoundary,
} from '../import-upload/import-upload.service.interface'
import {
  EqualityContentInput,
  MAX_EQUALITY_PDF_BYTES,
  resolveEqualityContent,
} from '../report/lib/equality-content'
import {
  EqualityContentTypeEnum,
  ReportStatusEnum,
  ReportTypeEnum,
} from '../report/models/report.enums'
import { ReportModel } from '../report/models/report.model'
import { EqualityPlanUploadService } from './equality-plan-upload.service'

/*
 * The request's CLS transaction, as the service sees it. `null` means "no
 * ambient transaction"; a test that sets it fires the `afterCommit` hooks by
 * hand to play the commit.
 */
let ambientTransaction: { afterCommit: jest.Mock } | null = null
jest.mock('cls-hooked', () => {
  const { CLS_NAMESPACE } = jest.requireActual('@dmr.is/constants')
  return {
    getNamespace: (name: string) =>
      name === CLS_NAMESPACE
        ? {
            get: (key: string) =>
              key === 'transaction' ? ambientTransaction : undefined,
          }
        : undefined,
  }
})

const BOUNDARY = ImportUploadBoundary.EQUALITY_PLAN
const REPORT_ID = '00000000-0000-0000-0000-0000000000cc'
const KEY = `doe-imports/equality-plan/${REPORT_ID}/11111111-1111-4111-8111-111111111111.pdf`
const PDF_BYTES = Buffer.from('%PDF-1.7\n1 0 obj\n<<>>\nendobj\n%%EOF\n')
const FILENAME = 'jafnrettisaaetlun.pdf'

const mockLogger = {
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

const makeReport = (overrides: Partial<ReportModel> = {}): ReportModel =>
  ({
    id: REPORT_ID,
    type: ReportTypeEnum.EQUALITY,
    status: ReportStatusEnum.DRAFT,
    ...overrides,
  }) as ReportModel

/** Lets a fire-and-forget cleanup (no ambient transaction) run to completion. */
const flush = () => new Promise((resolve) => setImmediate(resolve))

describe('EqualityPlanUploadService', () => {
  let service: EqualityPlanUploadService
  let importUpload: {
    createUpload: jest.Mock
    assertKeyWithinBoundary: jest.Mock
    fetchObject: jest.Mock
    cleanupAfter: jest.Mock
  }
  let reportModel: { findOne: jest.Mock }
  /**
   * The two reads the service makes, told apart by their options: the replay
   * check runs inside the request (no `transaction` option), the post-commit
   * landed check outside it (`transaction: null`).
   */
  let storedRow: { id: string } | null
  let landedRow: { id: string } | null

  /** What the draft PATCH and the IN_REVIEW edit do with the content. */
  const resolvingWrite = jest.fn(
    async (content: EqualityContentInput | null) =>
      content ? resolveEqualityContent(content) : null,
  )

  beforeEach(async () => {
    jest.clearAllMocks()
    ambientTransaction = null

    importUpload = {
      createUpload: jest
        .fn()
        .mockResolvedValue({ url: 'https://s3', key: KEY }),
      assertKeyWithinBoundary: jest.fn(),
      fetchObject: jest.fn().mockResolvedValue(PDF_BYTES),
      cleanupAfter: jest.fn().mockResolvedValue(undefined),
    }
    storedRow = null
    landedRow = { id: REPORT_ID }
    reportModel = {
      findOne: jest.fn(async (opts: { transaction?: null }) =>
        opts.transaction === null ? landedRow : storedRow,
      ),
    }

    const moduleRef = await Test.createTestingModule({
      providers: [
        EqualityPlanUploadService,
        { provide: LOGGER_PROVIDER, useValue: mockLogger },
        { provide: IImportUploadService, useValue: importUpload },
        { provide: getModelToken(ReportModel), useValue: reportModel },
      ],
    }).compile()

    service = moduleRef.get(EqualityPlanUploadService)
  })

  describe('presign', () => {
    it.each([ReportStatusEnum.DRAFT, ReportStatusEnum.IN_REVIEW])(
      'mints a PDF key in the plan boundary for a %s report',
      async (status) => {
        await expect(service.presign(makeReport({ status }))).resolves.toEqual({
          url: 'https://s3',
          key: KEY,
        })
        expect(importUpload.createUpload).toHaveBeenCalledWith(BOUNDARY, {
          extension: 'pdf',
          scope: REPORT_ID,
        })
      },
    )

    it('refuses a salary report', async () => {
      await expect(
        service.presign(makeReport({ type: ReportTypeEnum.SALARY })),
      ).rejects.toBeInstanceOf(BadRequestException)
      expect(importUpload.createUpload).not.toHaveBeenCalled()
    })

    it.each([ReportStatusEnum.SUBMITTED, ReportStatusEnum.APPROVED])(
      'refuses a report in status %s',
      async (status) => {
        await expect(
          service.presign(makeReport({ status })),
        ).rejects.toBeInstanceOf(BadRequestException)
        expect(importUpload.createUpload).not.toHaveBeenCalled()
      },
    )
  })

  describe('withStagedPlan — no key', () => {
    it.each([undefined, null, '', '  '])(
      'passes inline content through untouched when the key is %p',
      async (equalityReportPdfKey) => {
        const write = jest.fn().mockResolvedValue('written')
        const input = {
          equalityReportContent: '<p>Áætlun</p>',
          equalityReportPdfKey,
        }

        await expect(
          service.withStagedPlan(REPORT_ID, input, write),
        ).resolves.toBe('written')

        expect(write).toHaveBeenCalledWith({
          equalityReportContent: '<p>Áætlun</p>',
        })
        expect(importUpload.fetchObject).not.toHaveBeenCalled()
        expect(importUpload.cleanupAfter).not.toHaveBeenCalled()
      },
    )
  })

  it('drops a registeredPdfKey the caller sent, on the inline path', async () => {
    const write = jest.fn().mockResolvedValue('written')

    await service.withStagedPlan(
      REPORT_ID,
      {
        equalityReportPdf: PDF_BYTES.toString('base64'),
        equalityReportPdfFilename: FILENAME,
        registeredPdfKey: KEY,
      },
      write,
    )

    expect(write).toHaveBeenCalledWith({
      equalityReportPdf: PDF_BYTES.toString('base64'),
      equalityReportPdfFilename: FILENAME,
    })
  })

  describe('withStagedPlan — a resent key', () => {
    it('answers as a success and leaves the plan alone when the key delivered the current plan', async () => {
      storedRow = { id: REPORT_ID }

      await expect(
        service.withStagedPlan(
          REPORT_ID,
          { equalityReportPdfKey: KEY, equalityReportPdfFilename: FILENAME },
          resolvingWrite,
        ),
      ).resolves.toBeNull()

      expect(reportModel.findOne).toHaveBeenCalledWith({
        where: { id: REPORT_ID, equalityReportPdfKey: KEY },
        attributes: ['id'],
      })
      expect(resolvingWrite).toHaveBeenCalledWith(null)
      // Its object is already gone: nothing to read, nothing to delete.
      expect(importUpload.fetchObject).not.toHaveBeenCalled()
      expect(importUpload.cleanupAfter).not.toHaveBeenCalled()
    })

    it('reads the upload as usual when the report holds another plan', async () => {
      // A key whose plan was replaced since: the column no longer names it.
      storedRow = null

      await service.withStagedPlan(
        REPORT_ID,
        { equalityReportPdfKey: KEY, equalityReportPdfFilename: FILENAME },
        resolvingWrite,
      )

      expect(importUpload.fetchObject).toHaveBeenCalled()
      expect(resolvingWrite).not.toHaveBeenCalledWith(null)
    })

    it('never answers for another report: the scope check runs first', async () => {
      storedRow = { id: REPORT_ID }
      importUpload.assertKeyWithinBoundary.mockImplementation(() => {
        throw new BadRequestException('Invalid import upload key')
      })

      await expect(
        service.withStagedPlan(
          REPORT_ID,
          { equalityReportPdfKey: KEY, equalityReportPdfFilename: FILENAME },
          resolvingWrite,
        ),
      ).rejects.toBeInstanceOf(BadRequestException)

      expect(reportModel.findOne).not.toHaveBeenCalled()
      expect(resolvingWrite).not.toHaveBeenCalled()
    })

    it.each([
      [
        'inline content beside the key',
        {
          equalityReportPdfKey: KEY,
          equalityReportPdfFilename: FILENAME,
          equalityReportContent: '<p>x</p>',
        },
      ],
      ['no filename', { equalityReportPdfKey: KEY }],
    ])(
      'rejects %s even when the key is the stored one: the request checks run first',
      async (_case, input) => {
        storedRow = { id: REPORT_ID }

        await expect(
          service.withStagedPlan(REPORT_ID, input, resolvingWrite),
        ).rejects.toBeInstanceOf(BadRequestException)

        expect(reportModel.findOne).not.toHaveBeenCalled()
        expect(resolvingWrite).not.toHaveBeenCalled()
      },
    )
  })

  describe('withStagedPlan — by key', () => {
    it('stores the staged PDF exactly as an inline base64 PDF', async () => {
      const result = await service.withStagedPlan(
        REPORT_ID,
        { equalityReportPdfKey: KEY, equalityReportPdfFilename: FILENAME },
        resolvingWrite,
      )

      // Checked against this report, so a key minted for another one is refused.
      expect(importUpload.assertKeyWithinBoundary).toHaveBeenCalledWith(
        KEY,
        BOUNDARY,
        REPORT_ID,
      )
      expect(importUpload.fetchObject).toHaveBeenCalledWith(
        KEY,
        BOUNDARY,
        MAX_EQUALITY_PDF_BYTES,
      )
      // Byte-for-byte what the inline path stores for the same file, plus the
      // key that delivered it.
      expect(result).toEqual({
        ...resolveEqualityContent({
          equalityReportPdf: PDF_BYTES.toString('base64'),
          equalityReportPdfFilename: FILENAME,
        }),
        equalityReportPdfKey: KEY,
      })
      expect(result?.equalityReportContentType).toBe(
        EqualityContentTypeEnum.PDF,
      )
    })

    it('ignores an explicit null on the inline fields alongside a key', async () => {
      await service.withStagedPlan(
        REPORT_ID,
        {
          equalityReportPdfKey: KEY,
          equalityReportPdfFilename: FILENAME,
          equalityReportContent: null,
          equalityReportPdf: null,
        },
        resolvingWrite,
      )

      expect(resolvingWrite).toHaveBeenCalledWith({
        equalityReportContent: undefined,
        equalityReportPdf: PDF_BYTES.toString('base64'),
        equalityReportPdfFilename: FILENAME,
        registeredPdfKey: KEY,
      })
    })

    it.each([
      ['equalityReportPdf', { equalityReportPdf: 'JVBERi0=' }],
      ['equalityReportContent', { equalityReportContent: '<p>x</p>' }],
    ])(
      'rejects a key combined with %s without reading or deleting the upload',
      async (_field, inline) => {
        await expect(
          service.withStagedPlan(
            REPORT_ID,
            {
              equalityReportPdfKey: KEY,
              equalityReportPdfFilename: FILENAME,
              ...inline,
            },
            resolvingWrite,
          ),
        ).rejects.toBeInstanceOf(BadRequestException)

        expect(importUpload.fetchObject).not.toHaveBeenCalled()
        expect(importUpload.cleanupAfter).not.toHaveBeenCalled()
        expect(resolvingWrite).not.toHaveBeenCalled()
      },
    )

    it('requires a filename, and keeps the upload so the caller can resend', async () => {
      await expect(
        service.withStagedPlan(
          REPORT_ID,
          { equalityReportPdfKey: KEY },
          resolvingWrite,
        ),
      ).rejects.toThrow('equalityReportPdfFilename is required')

      expect(importUpload.fetchObject).not.toHaveBeenCalled()
      expect(importUpload.cleanupAfter).not.toHaveBeenCalled()
    })

    it('rejects a key outside the plan boundary before any read or delete', async () => {
      importUpload.assertKeyWithinBoundary.mockImplementation(() => {
        throw new BadRequestException('Invalid import upload key')
      })

      await expect(
        service.withStagedPlan(
          REPORT_ID,
          {
            equalityReportPdfKey:
              'doe-imports/equality-attachment/11111111-1111-4111-8111-111111111111.pdf',
            equalityReportPdfFilename: FILENAME,
          },
          resolvingWrite,
        ),
      ).rejects.toBeInstanceOf(BadRequestException)

      expect(importUpload.assertKeyWithinBoundary).toHaveBeenCalledWith(
        expect.any(String),
        BOUNDARY,
        REPORT_ID,
      )
      expect(importUpload.fetchObject).not.toHaveBeenCalled()
      expect(importUpload.cleanupAfter).not.toHaveBeenCalled()
    })

    it('rejects an empty upload and deletes it', async () => {
      importUpload.fetchObject.mockResolvedValue(Buffer.alloc(0))

      await expect(
        service.withStagedPlan(
          REPORT_ID,
          { equalityReportPdfKey: KEY, equalityReportPdfFilename: FILENAME },
          resolvingWrite,
        ),
      ).rejects.toThrow('empty')

      expect(resolvingWrite).not.toHaveBeenCalled()
      expect(importUpload.cleanupAfter).toHaveBeenCalledWith(
        KEY,
        BOUNDARY,
        expect.any(BadRequestException),
      )
    })

    it('rejects a file that is not a PDF and deletes it', async () => {
      importUpload.fetchObject.mockResolvedValue(
        Buffer.from('PK\u0003\u0004word/document.xml'),
      )

      await expect(
        service.withStagedPlan(
          REPORT_ID,
          { equalityReportPdfKey: KEY, equalityReportPdfFilename: FILENAME },
          resolvingWrite,
        ),
      ).rejects.toThrow('not a PDF')

      expect(importUpload.cleanupAfter).toHaveBeenCalledWith(
        KEY,
        BOUNDARY,
        expect.any(BadRequestException),
      )
    })

    it('hands a transient fetch failure to cleanupAfter, which keeps the object', async () => {
      const transient = new ServiceUnavailableException()
      importUpload.fetchObject.mockRejectedValue(transient)

      await expect(
        service.withStagedPlan(
          REPORT_ID,
          { equalityReportPdfKey: KEY, equalityReportPdfFilename: FILENAME },
          resolvingWrite,
        ),
      ).rejects.toBe(transient)

      // The terminal-vs-transient decision is `cleanupAfter`'s; passing the
      // error is what lets it keep the upload.
      expect(importUpload.cleanupAfter).toHaveBeenCalledWith(
        KEY,
        BOUNDARY,
        transient,
      )
      expect(transient.getStatus()).toBe(HttpStatus.SERVICE_UNAVAILABLE)
    })

    it('deletes the staged object once the row holds the PDF (no ambient transaction)', async () => {
      await service.withStagedPlan(
        REPORT_ID,
        { equalityReportPdfKey: KEY, equalityReportPdfFilename: FILENAME },
        resolvingWrite,
      )
      await flush()

      // Landed = the row records this key, which only this write sets and
      // every other plan write clears.
      expect(reportModel.findOne).toHaveBeenCalledWith({
        where: { id: REPORT_ID, equalityReportPdfKey: KEY },
        attributes: ['id'],
        transaction: null,
      })
      // Success: no error, so `cleanupAfter` treats it as terminal and deletes.
      expect(importUpload.cleanupAfter).toHaveBeenCalledWith(KEY, BOUNDARY)
    })

    it('keeps the staged object when the row does not hold the PDF', async () => {
      landedRow = null

      await service.withStagedPlan(
        REPORT_ID,
        { equalityReportPdfKey: KEY, equalityReportPdfFilename: FILENAME },
        resolvingWrite,
      )
      await flush()

      expect(importUpload.cleanupAfter).not.toHaveBeenCalled()
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('did not commit'),
        expect.anything(),
      )
    })

    it('defers the delete until the request transaction commits', async () => {
      ambientTransaction = { afterCommit: jest.fn() }

      await service.withStagedPlan(
        REPORT_ID,
        { equalityReportPdfKey: KEY, equalityReportPdfFilename: FILENAME },
        resolvingWrite,
      )
      await flush()

      expect(importUpload.cleanupAfter).not.toHaveBeenCalled()
      expect(ambientTransaction.afterCommit).toHaveBeenCalledTimes(1)

      const [hook] = ambientTransaction.afterCommit.mock.calls[0]
      await hook()

      expect(importUpload.cleanupAfter).toHaveBeenCalledWith(KEY, BOUNDARY)
    })

    it('does not schedule a delete when the write fails', async () => {
      ambientTransaction = { afterCommit: jest.fn() }
      const failure = new BadRequestException('nope')

      await expect(
        service.withStagedPlan(
          REPORT_ID,
          { equalityReportPdfKey: KEY, equalityReportPdfFilename: FILENAME },
          jest.fn().mockRejectedValue(failure),
        ),
      ).rejects.toBe(failure)

      expect(ambientTransaction.afterCommit).not.toHaveBeenCalled()
      expect(importUpload.cleanupAfter).toHaveBeenCalledWith(
        KEY,
        BOUNDARY,
        failure,
      )
    })
  })
})
