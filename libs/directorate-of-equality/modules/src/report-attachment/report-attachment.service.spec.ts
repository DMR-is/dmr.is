import { Transaction } from 'sequelize'

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
  let scopedFindOne: jest.Mock
  let attachmentScope: jest.Mock
  let reportFindOne: jest.Mock

  beforeEach(async () => {
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
    scopedFindOne = jest.fn()
    attachmentScope = jest.fn().mockReturnValue({ findOne: scopedFindOne })
    reportFindOne = jest.fn(async () => makeReport())

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
            scope: attachmentScope,
          },
        },
        {
          provide: getModelToken(ReportModel),
          useValue: { findOne: reportFindOne },
        },
      ],
    }).compile()

    service = moduleRef.get(ReportAttachmentService)
  })

  describe('add', () => {
    it('stores the file under a lock, then deletes the staged object', async () => {
      const result = await service.add(makeReport(), {
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
      expect(attachmentCreate).toHaveBeenCalledWith({
        reportId: REPORT_ID,
        filename: 'Aðgerðaáætlun.xlsx',
        extension: ReportAttachmentExtensionEnum.XLSX,
        sizeBytes: XLSX_BYTES.length,
        content: XLSX_BYTES,
      })
      // No error: success is terminal for the staged object.
      expect(importUpload.cleanupAfter).toHaveBeenCalledWith(KEY, BOUNDARY)
      expect(result).not.toHaveProperty('content')
      expect(result.extension).toBe(ReportAttachmentExtensionEnum.XLSX)
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

    it('refuses the seventh attachment, counted under the lock', async () => {
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

    it('refuses a filename whose extension differs from the upload', async () => {
      await expect(
        service.add(makeReport(), { key: KEY, filename: 'a.pdf' }),
      ).rejects.toThrow(/does not match/)
      expect(importUpload.fetchObject).not.toHaveBeenCalled()
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
    it('deletes only within the given report', async () => {
      await service.remove(makeReport(), 'attachment-1')

      expect(attachmentDestroy).toHaveBeenCalledWith({
        where: { id: 'attachment-1', reportId: REPORT_ID },
      })
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

  describe('getFile', () => {
    it('reads the bytes only through the content scope, within the report', async () => {
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

    it('404s when the attachment is not on the report', async () => {
      scopedFindOne.mockResolvedValueOnce(null)

      await expect(
        service.getFile(REPORT_ID, 'attachment-1'),
      ).rejects.toBeInstanceOf(NotFoundException)
    })
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
