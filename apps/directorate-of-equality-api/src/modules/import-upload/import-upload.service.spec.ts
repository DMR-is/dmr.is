import { BadRequestException, PayloadTooLargeException } from '@nestjs/common'

import { IAWSService } from '@dmr.is/shared-modules'
import { ResultWrapper } from '@dmr.is/types'

import { ImportUploadService } from './import-upload.service'
import { ImportUploadBoundary } from './import-upload.service.interface'

const BUCKET = 'test-doe-imports'
const ONE_MB = 1024 * 1024
const MAX_UPLOAD_BYTES = ONE_MB * 20

// doe-imports/<boundary>/<uuid>.xlsx
const ADMIN_KEY = 'doe-imports/admin/11111111-2222-3333-4444-555555555555.xlsx'
const APP_KEY =
  'doe-imports/application/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee.xlsx'

const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

/** A buffer of a given logical size without actually allocating it. */
const bufferOfSize = (length: number) => ({ length }) as unknown as Buffer

describe('ImportUploadService', () => {
  let aws: jest.Mocked<Pick<IAWSService, 'getPresignedUrl' | 'getObjectBuffer' | 'deleteObject'>>
  let service: ImportUploadService

  beforeAll(() => {
    process.env.AWS_SALARY_ANALYSIS_FILES_BUCKET = BUCKET
  })

  afterAll(() => {
    delete process.env.AWS_SALARY_ANALYSIS_FILES_BUCKET
  })

  beforeEach(() => {
    jest.clearAllMocks()
    aws = {
      getPresignedUrl: jest.fn(),
      getObjectBuffer: jest.fn(),
      deleteObject: jest.fn(),
    }
    service = new ImportUploadService(
      mockLogger as never,
      aws as unknown as IAWSService,
    )
  })

  describe('createUpload', () => {
    it('returns a presigned url and a boundary-namespaced key', async () => {
      aws.getPresignedUrl.mockResolvedValue(
        ResultWrapper.ok({ url: 'https://s3/presigned' }),
      )

      const res = await service.createUpload(ImportUploadBoundary.ADMIN)

      expect(res.url).toBe('https://s3/presigned')
      expect(res.key).toMatch(
        /^doe-imports\/admin\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.xlsx$/,
      )
    })

    it('namespaces the key per boundary', async () => {
      aws.getPresignedUrl.mockResolvedValue(
        ResultWrapper.ok({ url: 'https://s3/presigned' }),
      )

      const res = await service.createUpload(ImportUploadBoundary.APPLICATION)

      expect(res.key.startsWith('doe-imports/application/')).toBe(true)
    })

    it('presigns against the DOE imports bucket with the generated key', async () => {
      aws.getPresignedUrl.mockResolvedValue(
        ResultWrapper.ok({ url: 'https://s3/presigned' }),
      )

      const res = await service.createUpload(ImportUploadBoundary.ADMIN)

      expect(aws.getPresignedUrl).toHaveBeenCalledWith(res.key, BUCKET)
    })

    it('produces a key that passes its own boundary validation (round-trip)', async () => {
      aws.getPresignedUrl.mockResolvedValue(
        ResultWrapper.ok({ url: 'https://s3/presigned' }),
      )
      aws.getObjectBuffer.mockResolvedValue(ResultWrapper.ok(bufferOfSize(10)))

      const { key } = await service.createUpload(ImportUploadBoundary.ADMIN)

      await expect(
        service.fetchWorkbook(key, ImportUploadBoundary.ADMIN),
      ).resolves.toBeDefined()
    })
  })

  describe('fetchWorkbook', () => {
    it('fetches the object from the DOE imports bucket for a valid key', async () => {
      const buffer = bufferOfSize(1234)
      aws.getObjectBuffer.mockResolvedValue(ResultWrapper.ok(buffer))

      const result = await service.fetchWorkbook(
        ADMIN_KEY,
        ImportUploadBoundary.ADMIN,
      )

      expect(result).toBe(buffer)
      expect(aws.getObjectBuffer).toHaveBeenCalledWith(ADMIN_KEY, BUCKET)
    })

    it('accepts an application key on the application boundary', async () => {
      aws.getObjectBuffer.mockResolvedValue(ResultWrapper.ok(bufferOfSize(1)))

      await expect(
        service.fetchWorkbook(APP_KEY, ImportUploadBoundary.APPLICATION),
      ).resolves.toBeDefined()
    })

    it('rejects a key from another boundary without touching S3', async () => {
      // An admin-namespaced key presented to the application boundary.
      await expect(
        service.fetchWorkbook(ADMIN_KEY, ImportUploadBoundary.APPLICATION),
      ).rejects.toBeInstanceOf(BadRequestException)

      expect(aws.getObjectBuffer).not.toHaveBeenCalled()
    })

    it.each([
      ['no prefix', '11111111-2222-3333-4444-555555555555.xlsx'],
      ['wrong prefix', 'other/admin/11111111-2222-3333-4444-555555555555.xlsx'],
      ['path traversal', 'doe-imports/admin/../../etc/passwd'],
      ['not a uuid', 'doe-imports/admin/not-a-uuid.xlsx'],
      ['wrong extension', 'doe-imports/admin/11111111-2222-3333-4444-555555555555.csv'],
      ['trailing segment', 'doe-imports/admin/11111111-2222-3333-4444-555555555555.xlsx/x'],
    ])('rejects a malformed key (%s) without touching S3', async (_label, key) => {
      await expect(
        service.fetchWorkbook(key, ImportUploadBoundary.ADMIN),
      ).rejects.toBeInstanceOf(BadRequestException)

      expect(aws.getObjectBuffer).not.toHaveBeenCalled()
    })

    it('rejects a workbook over the 20MB cap', async () => {
      aws.getObjectBuffer.mockResolvedValue(
        ResultWrapper.ok(bufferOfSize(MAX_UPLOAD_BYTES + 1)),
      )

      await expect(
        service.fetchWorkbook(ADMIN_KEY, ImportUploadBoundary.ADMIN),
      ).rejects.toBeInstanceOf(PayloadTooLargeException)
    })

    it('accepts a workbook exactly at the 20MB cap', async () => {
      aws.getObjectBuffer.mockResolvedValue(
        ResultWrapper.ok(bufferOfSize(MAX_UPLOAD_BYTES)),
      )

      await expect(
        service.fetchWorkbook(ADMIN_KEY, ImportUploadBoundary.ADMIN),
      ).resolves.toBeDefined()
    })
  })

  describe('cleanup', () => {
    it('deletes the staged object from the DOE imports bucket', async () => {
      aws.deleteObject.mockResolvedValue(ResultWrapper.ok())

      await service.cleanup(ADMIN_KEY)

      expect(aws.deleteObject).toHaveBeenCalledWith(ADMIN_KEY, BUCKET)
    })

    it('swallows delete failures (best-effort) and logs a warning', async () => {
      aws.deleteObject.mockRejectedValue(new Error('S3 down'))

      await expect(service.cleanup(ADMIN_KEY)).resolves.toBeUndefined()
      expect(mockLogger.warn).toHaveBeenCalled()
    })
  })

  // With no bucket configured the service bypasses S3 and stages uploads on
  // disk. These tests round-trip through a real temp dir.
  describe('local mode (no bucket configured)', () => {
    beforeEach(() => {
      delete process.env.AWS_SALARY_ANALYSIS_FILES_BUCKET
    })

    afterEach(() => {
      process.env.AWS_SALARY_ANALYSIS_FILES_BUCKET = BUCKET
    })

    it('createUpload returns a local API url and never touches S3', async () => {
      const res = await service.createUpload(ImportUploadBoundary.ADMIN)

      expect(res.url).toContain('/api/v1/imports/local?key=')
      expect(res.url).toContain(encodeURIComponent(res.key))
      expect(aws.getPresignedUrl).not.toHaveBeenCalled()
    })

    it('round-trips a stored workbook through fetchWorkbook without S3', async () => {
      const { key } = await service.createUpload(ImportUploadBoundary.ADMIN)
      const data = Buffer.from('workbook-bytes')

      await service.storeLocalUpload(key, data)
      const fetched = await service.fetchWorkbook(key, ImportUploadBoundary.ADMIN)

      expect(fetched.equals(data)).toBe(true)
      expect(aws.getObjectBuffer).not.toHaveBeenCalled()

      await service.cleanup(key)
      await expect(
        service.fetchWorkbook(key, ImportUploadBoundary.ADMIN),
      ).rejects.toBeInstanceOf(BadRequestException)
    })

    it('storeLocalUpload rejects a malformed key', async () => {
      await expect(
        service.storeLocalUpload('not-a-valid-key', Buffer.from('x')),
      ).rejects.toBeInstanceOf(BadRequestException)
    })

    it('storeLocalUpload rejects a workbook over the 20MB cap', async () => {
      await expect(
        service.storeLocalUpload(ADMIN_KEY, bufferOfSize(MAX_UPLOAD_BYTES + 1)),
      ).rejects.toBeInstanceOf(PayloadTooLargeException)
    })
  })

  it('storeLocalUpload is disabled when a bucket is configured', async () => {
    await expect(
      service.storeLocalUpload(ADMIN_KEY, Buffer.from('x')),
    ).rejects.toBeInstanceOf(BadRequestException)
  })
})
