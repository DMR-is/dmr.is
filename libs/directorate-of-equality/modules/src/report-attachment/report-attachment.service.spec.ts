import { Op, Transaction } from 'sequelize'

import {
  BadRequestException,
  HttpException,
  HttpStatus,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common'
import { getModelToken } from '@nestjs/sequelize'
import { Test } from '@nestjs/testing'

import { LOGGER_PROVIDER } from '@dmr.is/logging'

import { CompanyReportModel } from '../company/models/company-report.model'
import {
  IImportUploadService,
  ImportUploadBoundary,
} from '../import-upload/import-upload.service.interface'
import { ReportStatusEnum, ReportTypeEnum } from '../report/models/report.enums'
import { ReportModel } from '../report/models/report.model'
import {
  MAX_REPORT_ATTACHMENT_BYTES,
  MAX_REPORT_ATTACHMENTS,
} from './lib/attachment-file'
import {
  REPORT_ATTACHMENT_WITH_CONTENT,
  ReportAttachmentExtensionEnum,
  ReportAttachmentModel,
} from './models/report-attachment.model'
import { ReportAttachmentService } from './report-attachment.service'

/*
 * The request's CLS transaction, as the service sees it. `null` means "no
 * ambient transaction" (the unit-test default); a test that sets it can fire
 * the `afterCommit` hooks by hand to play the commit.
 */
let ambientTransaction: { afterCommit: jest.Mock } | null = null
// Answers only the namespace and key `CLSMiddleware` commits, so a wrong name
// falls into the no-transaction branch and the after-commit tests fail.
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

const BOUNDARY = ImportUploadBoundary.EQUALITY_ATTACHMENT
const REPORT_ID = '00000000-0000-0000-0000-0000000000cc'
const KEY = `doe-imports/equality-attachment/11111111-1111-4111-8111-111111111111.xlsx`
const XLSX_BYTES = Buffer.concat([
  Buffer.from([0x50, 0x4b, 0x03, 0x04]),
  Buffer.from('xl/workbook.xml'),
])

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

describe('ReportAttachmentService', () => {
  let service: ReportAttachmentService
  let importUpload: {
    createUpload: jest.Mock
    assertKeyWithinBoundary: jest.Mock
    fetchObject: jest.Mock
    cleanupAfter: jest.Mock
  }
  let attachmentCreate: jest.Mock
  let attachmentCount: jest.Mock
  let attachmentDestroy: jest.Mock
  let attachmentFindAll: jest.Mock
  let attachmentFindOne: jest.Mock
  let scopedFindOne: jest.Mock
  let attachmentScope: jest.Mock
  let reportFindOne: jest.Mock
  let reportUpdate: jest.Mock

  beforeEach(async () => {
    ambientTransaction = null
    importUpload = {
      createUpload: jest.fn().mockResolvedValue({ url: 'u', key: KEY }),
      assertKeyWithinBoundary: jest.fn(),
      fetchObject: jest.fn().mockResolvedValue(XLSX_BYTES),
      cleanupAfter: jest.fn().mockResolvedValue(undefined),
    }
    attachmentCreate = jest.fn(async (row) => ({
      ...row,
      id: 'attachment-1',
      createdAt: new Date('2026-11-09T00:00:00Z'),
    }))
    attachmentCount = jest.fn().mockResolvedValue(0)
    attachmentDestroy = jest.fn().mockResolvedValue(1)
    attachmentFindAll = jest.fn().mockResolvedValue([])
    // The post-commit "did the row land" check.
    attachmentFindOne = jest.fn().mockResolvedValue({ id: 'attachment-1' })
    scopedFindOne = jest.fn()
    attachmentScope = jest.fn().mockReturnValue({ findOne: scopedFindOne })
    // Both the row lock and the reviewer-visibility check read the report.
    reportFindOne = jest.fn(async () => makeReport())
    reportUpdate = jest.fn().mockResolvedValue([1])

    const moduleRef = await Test.createTestingModule({
      providers: [
        ReportAttachmentService,
        { provide: LOGGER_PROVIDER, useValue: mockLogger },
        { provide: IImportUploadService, useValue: importUpload },
        {
          provide: getModelToken(ReportAttachmentModel),
          useValue: {
            create: attachmentCreate,
            count: attachmentCount,
            destroy: attachmentDestroy,
            findAll: attachmentFindAll,
            findOne: attachmentFindOne,
            scope: attachmentScope,
          },
        },
        {
          provide: getModelToken(ReportModel),
          useValue: { findOne: reportFindOne, update: reportUpdate },
        },
      ],
    }).compile()

    service = moduleRef.get(ReportAttachmentService)
  })

  describe('add', () => {
    it('stores the file under a lock and returns the status read under it', async () => {
      const { attachment, reportStatus } = await service.add(makeReport(), {
        key: KEY,
        filename: 'Aðgerðaáætlun.xlsx',
      })

      expect(importUpload.fetchObject).toHaveBeenCalledWith(
        KEY,
        BOUNDARY,
        MAX_REPORT_ATTACHMENT_BYTES,
      )
      expect(reportFindOne).toHaveBeenCalledWith(
        expect.objectContaining({ lock: Transaction.LOCK.UPDATE }),
      )
      expect(attachmentCreate).toHaveBeenCalledWith(
        {
          reportId: REPORT_ID,
          filename: 'Aðgerðaáætlun.xlsx',
          extension: ReportAttachmentExtensionEnum.XLSX,
          sizeBytes: XLSX_BYTES.length,
          content: XLSX_BYTES,
        },
        // The insert must not echo 4 MB of bytea back from Postgres.
        { returning: expect.not.arrayContaining(['content']) },
      )
      expect(attachment).not.toHaveProperty('content')
      expect(attachment.extension).toBe(ReportAttachmentExtensionEnum.XLSX)
      expect(reportStatus).toBe(ReportStatusEnum.DRAFT)
    })

    it('counts the attachments only after taking the lock', async () => {
      await service.add(makeReport(), { key: KEY, filename: 'a.xlsx' })

      const lockCall = reportFindOne.mock.invocationCallOrder[0]
      const countCall = attachmentCount.mock.invocationCallOrder[0]
      expect(countCall).toBeGreaterThan(lockCall)
    })

    it('refreshes a draft so the stale-draft reaper counts the upload as activity', async () => {
      await service.add(makeReport(), { key: KEY, filename: 'a.xlsx' })

      expect(reportUpdate).toHaveBeenCalledWith(
        { updatedAt: expect.any(Date) },
        { where: { id: REPORT_ID }, silent: true },
      )
    })

    it('does not touch updated_at on a report in review', async () => {
      reportFindOne.mockResolvedValue(
        makeReport({ status: ReportStatusEnum.IN_REVIEW }),
      )

      await service.add(makeReport({ status: ReportStatusEnum.IN_REVIEW }), {
        key: KEY,
        filename: 'a.xlsx',
      })

      expect(reportUpdate).not.toHaveBeenCalled()
    })

    describe('deleting the staged object', () => {
      it('waits for the commit, then deletes only once the row is confirmed', async () => {
        ambientTransaction = { afterCommit: jest.fn() }

        await service.add(makeReport(), { key: KEY, filename: 'a.xlsx' })

        // Nothing is deleted while the request can still roll back.
        expect(importUpload.cleanupAfter).not.toHaveBeenCalled()
        expect(ambientTransaction.afterCommit).toHaveBeenCalledTimes(1)

        await ambientTransaction.afterCommit.mock.calls[0][0]()

        expect(attachmentFindOne).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { id: 'attachment-1' },
            transaction: null,
          }),
        )
        expect(importUpload.cleanupAfter).toHaveBeenCalledWith(KEY, BOUNDARY)
      })

      it('keeps the upload when the hook fires for a commit that did not land', async () => {
        ambientTransaction = { afterCommit: jest.fn() }
        attachmentFindOne.mockResolvedValueOnce(null)

        await service.add(makeReport(), { key: KEY, filename: 'a.xlsx' })
        await ambientTransaction.afterCommit.mock.calls[0][0]()

        expect(importUpload.cleanupAfter).not.toHaveBeenCalled()
      })

      it('never lets a failing post-commit check escape the hook', async () => {
        ambientTransaction = { afterCommit: jest.fn() }
        attachmentFindOne.mockRejectedValueOnce(new Error('db gone'))

        await service.add(makeReport(), { key: KEY, filename: 'a.xlsx' })

        await expect(
          ambientTransaction.afterCommit.mock.calls[0][0](),
        ).resolves.toBeUndefined()
        expect(importUpload.cleanupAfter).not.toHaveBeenCalled()
      })

      it('deletes straight away when there is no request transaction', async () => {
        await service.add(makeReport(), { key: KEY, filename: 'a.xlsx' })
        await flush()

        expect(importUpload.cleanupAfter).toHaveBeenCalledWith(KEY, BOUNDARY)
      })
    })

    it('refuses a key outside the boundary before any read or cleanup', async () => {
      importUpload.assertKeyWithinBoundary.mockImplementationOnce(() => {
        throw new BadRequestException('Invalid import upload key')
      })

      await expect(
        service.add(makeReport(), {
          key: 'elsewhere/x.xlsx',
          filename: 'a.xlsx',
        }),
      ).rejects.toBeInstanceOf(BadRequestException)
      expect(importUpload.fetchObject).not.toHaveBeenCalled()
      expect(importUpload.cleanupAfter).not.toHaveBeenCalled()
    })

    it('refuses the seventh attachment and deletes the staged object', async () => {
      attachmentCount.mockResolvedValue(MAX_REPORT_ATTACHMENTS)

      await expect(
        service.add(makeReport(), { key: KEY, filename: 'a.xlsx' }),
      ).rejects.toThrow(/at most 6/)
      expect(attachmentCreate).not.toHaveBeenCalled()
      // A 400 is terminal: the staged object goes.
      expect(importUpload.cleanupAfter).toHaveBeenCalledWith(
        KEY,
        BOUNDARY,
        expect.any(BadRequestException),
      )
    })

    it('refuses when the review concluded during the download', async () => {
      reportFindOne.mockResolvedValueOnce(
        makeReport({ status: ReportStatusEnum.APPROVED }),
      )

      await expect(
        service.add(makeReport({ status: ReportStatusEnum.IN_REVIEW }), {
          key: KEY,
          filename: 'a.xlsx',
        }),
      ).rejects.toThrow(/status APPROVED/)
      expect(attachmentCreate).not.toHaveBeenCalled()
    })

    it('refuses a mismatched filename without deleting the upload it could retry with', async () => {
      await expect(
        service.add(makeReport(), { key: KEY, filename: 'a.pdf' }),
      ).rejects.toThrow(/does not match/)
      expect(importUpload.fetchObject).not.toHaveBeenCalled()
      expect(importUpload.cleanupAfter).not.toHaveBeenCalled()
    })

    it('refuses bytes that are not what the extension says', async () => {
      importUpload.fetchObject.mockResolvedValueOnce(Buffer.from('%PDF-1.7'))

      await expect(
        service.add(makeReport(), { key: KEY, filename: 'a.xlsx' }),
      ).rejects.toThrow(/do not match/)
      expect(attachmentCreate).not.toHaveBeenCalled()
    })

    it('passes a 413 through and lets cleanup see it', async () => {
      const tooLarge = new HttpException('big', HttpStatus.PAYLOAD_TOO_LARGE)
      importUpload.fetchObject.mockRejectedValueOnce(tooLarge)

      await expect(
        service.add(makeReport(), { key: KEY, filename: 'a.xlsx' }),
      ).rejects.toBe(tooLarge)
      expect(importUpload.cleanupAfter).toHaveBeenCalledWith(
        KEY,
        BOUNDARY,
        tooLarge,
      )
    })

    it('hands a transient failure to cleanup, which keeps the object for a retry', async () => {
      const transient = new ServiceUnavailableException('S3 down')
      importUpload.fetchObject.mockRejectedValueOnce(transient)

      await expect(
        service.add(makeReport(), { key: KEY, filename: 'a.xlsx' }),
      ).rejects.toBe(transient)
      expect(importUpload.cleanupAfter).toHaveBeenCalledWith(
        KEY,
        BOUNDARY,
        transient,
      )
    })

    it.each([
      ['a salary report', { type: ReportTypeEnum.SALARY }],
      ['a SUBMITTED report', { status: ReportStatusEnum.SUBMITTED }],
      ['an APPROVED report', { status: ReportStatusEnum.APPROVED }],
      ['a WITHDRAWN report', { status: ReportStatusEnum.WITHDRAWN }],
    ])('refuses %s', async (_label, overrides) => {
      await expect(
        service.add(makeReport(overrides), { key: KEY, filename: 'a.xlsx' }),
      ).rejects.toBeInstanceOf(BadRequestException)
      expect(importUpload.fetchObject).not.toHaveBeenCalled()
    })
  })

  describe('presign', () => {
    it('presigns in the attachment boundary with the normalised extension', async () => {
      await service.presign(makeReport(), '.XLS')

      expect(importUpload.createUpload).toHaveBeenCalledWith(BOUNDARY, {
        extension: ReportAttachmentExtensionEnum.XLS,
      })
    })

    it('refuses at the limit, before the applicant uploads anything', async () => {
      attachmentCount.mockResolvedValue(MAX_REPORT_ATTACHMENTS)

      await expect(service.presign(makeReport(), 'pdf')).rejects.toThrow(
        /at most 6/,
      )
      expect(importUpload.createUpload).not.toHaveBeenCalled()
    })

    it('refuses a macro-enabled type', async () => {
      await expect(service.presign(makeReport(), 'xlsm')).rejects.toThrow(
        /Unsupported/,
      )
    })
  })

  describe('remove', () => {
    it('deletes only within the given report, under the lock, and returns the locked status', async () => {
      reportFindOne.mockResolvedValueOnce(
        makeReport({ status: ReportStatusEnum.IN_REVIEW }),
      )

      const { reportStatus } = await service.remove(
        makeReport({ status: ReportStatusEnum.IN_REVIEW }),
        'attachment-1',
      )

      expect(reportFindOne).toHaveBeenCalledWith(
        expect.objectContaining({ lock: Transaction.LOCK.UPDATE }),
      )
      expect(reportFindOne.mock.invocationCallOrder[0]).toBeLessThan(
        attachmentDestroy.mock.invocationCallOrder[0],
      )
      expect(attachmentDestroy).toHaveBeenCalledWith({
        where: { id: 'attachment-1', reportId: REPORT_ID },
      })
      expect(reportStatus).toBe(ReportStatusEnum.IN_REVIEW)
    })

    it('refuses when a reviewer decided the report while the request was in flight', async () => {
      reportFindOne.mockResolvedValueOnce(
        makeReport({ status: ReportStatusEnum.APPROVED }),
      )

      await expect(
        service.remove(
          makeReport({ status: ReportStatusEnum.IN_REVIEW }),
          'attachment-1',
        ),
      ).rejects.toThrow(/status APPROVED/)
      expect(attachmentDestroy).not.toHaveBeenCalled()
    })

    it('refreshes a draft', async () => {
      await service.remove(makeReport(), 'attachment-1')

      expect(reportUpdate).toHaveBeenCalledWith(
        { updatedAt: expect.any(Date) },
        { where: { id: REPORT_ID }, silent: true },
      )
    })

    it("404s on an attachment that is not this report's", async () => {
      attachmentDestroy.mockResolvedValueOnce(0)

      await expect(
        service.remove(makeReport(), 'attachment-x'),
      ).rejects.toBeInstanceOf(NotFoundException)
    })

    it('refuses once the report is no longer attachable', async () => {
      await expect(
        service.remove(
          makeReport({ status: ReportStatusEnum.APPROVED }),
          'attachment-1',
        ),
      ).rejects.toBeInstanceOf(BadRequestException)
      expect(attachmentDestroy).not.toHaveBeenCalled()
    })
  })

  describe('reviewer reads', () => {
    it('getFile reads the bytes only through the content scope, within the report', async () => {
      scopedFindOne.mockResolvedValueOnce({
        filename: 'plan.xls',
        extension: ReportAttachmentExtensionEnum.XLS,
        content: Buffer.from('x'),
      })

      const file = await service.getFile(REPORT_ID, 'attachment-1')

      expect(attachmentScope).toHaveBeenCalledWith(
        REPORT_ATTACHMENT_WITH_CONTENT,
      )
      expect(scopedFindOne).toHaveBeenCalledWith({
        where: { id: 'attachment-1', reportId: REPORT_ID },
      })
      expect(file.contentType).toBe('application/vnd.ms-excel')
    })

    it('getFile 404s when the attachment is not on the report', async () => {
      scopedFindOne.mockResolvedValueOnce(null)

      await expect(
        service.getFile(REPORT_ID, 'attachment-1'),
      ).rejects.toBeInstanceOf(NotFoundException)
    })

    it.each([
      ['getFile', (s: ReportAttachmentService) => s.getFile(REPORT_ID, 'a-1')],
      [
        'listForReviewer',
        (s: ReportAttachmentService) => s.listForReviewer(REPORT_ID),
      ],
    ])(
      '%s 404s for a draft, which reviewers cannot see',
      async (_label, call) => {
        // The visibility query excludes DRAFT, so a draft finds no row.
        reportFindOne.mockResolvedValueOnce(null)

        await expect(call(service)).rejects.toBeInstanceOf(NotFoundException)
        expect(scopedFindOne).not.toHaveBeenCalled()
        expect(attachmentFindAll).not.toHaveBeenCalled()
      },
    )

    it.each([
      ['getFile', (s: ReportAttachmentService) => s.getFile(REPORT_ID, 'a-1')],
      [
        'listForReviewer',
        (s: ReportAttachmentService) => s.listForReviewer(REPORT_ID),
      ],
    ])(
      '%s asks only for reports the admin detail can load',
      async (_label, call) => {
        scopedFindOne.mockResolvedValueOnce({
          filename: 'a.pdf',
          extension: ReportAttachmentExtensionEnum.PDF,
          content: Buffer.from('%PDF-'),
        })

        await call(service)

        // Not a draft, AND joined to the parent snapshot the admin detail
        // inner-joins: a report withdrawn as a draft is WITHDRAWN but has none.
        expect(reportFindOne).toHaveBeenCalledWith(
          expect.objectContaining({
            where: {
              id: REPORT_ID,
              status: { [Op.ne]: ReportStatusEnum.DRAFT },
            },
            include: [
              expect.objectContaining({
                model: CompanyReportModel,
                required: true,
                where: { parentCompanyId: null },
              }),
            ],
          }),
        )
      },
    )
  })

  describe('list', () => {
    it('never selects the bytes', async () => {
      await service.list(REPORT_ID)

      // The default scope excludes `content`; the list must not override it.
      expect(attachmentScope).not.toHaveBeenCalled()
      expect(attachmentFindAll).toHaveBeenCalledWith(
        expect.not.objectContaining({ attributes: expect.anything() }),
      )
    })
  })
})
