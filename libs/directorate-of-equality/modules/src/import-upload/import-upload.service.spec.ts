import { mkdir, rm, stat, truncate, writeFile } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'

import {
  BadRequestException,
  HttpException,
  PayloadTooLargeException,
} from '@nestjs/common'

import { IAWSService } from '@dmr.is/shared-modules'
import { ResultWrapper } from '@dmr.is/types'

import { ImportUploadService } from './import-upload.service'
import { ImportUploadBoundary } from './import-upload.service.interface'

// `readFile` is wrapped (not stubbed) so a test can assert that an oversized
// file is rejected from its `stat` alone, without ever being read into memory.
jest.mock('fs/promises', () => {
  const actual = jest.requireActual('fs/promises')

  return {
    ...actual,
    readFile: jest.fn((...args: Array<unknown>) => actual.readFile(...args)),
  }
})

const BUCKET = 'test-doe-imports'
const ONE_MB = 1024 * 1024
const MAX_UPLOAD_BYTES = ONE_MB * 20

// doe-imports/<boundary>/<uuid>.xlsx
const ADMIN_KEY = 'doe-imports/admin/11111111-2222-3333-4444-555555555555.xlsx'
const APP_KEY =
  'doe-imports/application/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee.xlsx'

/** Mirrors the staging dir and key flattening in ImportUploadService. */
const { readFile: mockReadFile } = jest.requireMock('fs/promises') as {
  readFile: jest.Mock
}

const LOCAL_UPLOAD_DIR = join(tmpdir(), 'doe-import-uploads')
const localPathFor = (key: string) =>
  join(LOCAL_UPLOAD_DIR, key.replace(/\//g, '_'))

const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

/** The shape getObjectBuffer returns when @LogAndHandle caught an HttpException. */
const awsError = (code: number, message: string) =>
  ResultWrapper.err<Buffer, { code: number; message: string }>({
    code,
    message,
  })

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
      expect(aws.getObjectBuffer).toHaveBeenCalledWith(ADMIN_KEY, BUCKET, {
        maxBytes: MAX_UPLOAD_BYTES,
      })
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

    it('deletes the object when the download is rejected as too large', async () => {
      // A 413 out of getObjectBuffer arrives via ResultWrapper.unwrap as a bare
      // HttpException, not a PayloadTooLargeException.
      aws.getObjectBuffer.mockResolvedValue(
        awsError(413, 'Object exceeds the maximum allowed size of 20MB'),
      )
      aws.deleteObject.mockResolvedValue(ResultWrapper.ok())

      let thrown: unknown
      try {
        await service.fetchWorkbook(ADMIN_KEY, ImportUploadBoundary.ADMIN)
      } catch (error) {
        thrown = error
      }

      // The caller still sees the original 413 …
      expect(thrown).toBeInstanceOf(HttpException)
      expect((thrown as HttpException).getStatus()).toBe(413)
      // … and the object it refused is gone, so it cannot be used to park data.
      expect(aws.deleteObject).toHaveBeenCalledWith(ADMIN_KEY, BUCKET)
    })

    it('leaves the object in place when the download fails for any other reason', async () => {
      // A transient S3 failure must not destroy the caller's upload.
      aws.getObjectBuffer.mockResolvedValue(awsError(500, 'S3 is having a day'))

      await expect(
        service.fetchWorkbook(ADMIN_KEY, ImportUploadBoundary.ADMIN),
      ).rejects.toBeInstanceOf(HttpException)

      expect(aws.deleteObject).not.toHaveBeenCalled()
    })

    it('never deletes on the invalid-key path (arbitrary-object DELETE guard)', async () => {
      // A client-supplied key must never become an arbitrary DELETE in the
      // imports bucket. `cleanup` now validates too (see below), so this is
      // one of two independent guards rather than the only one — keep both.
      await expect(
        service.fetchWorkbook(
          'doe-imports/admin/../../etc/passwd',
          ImportUploadBoundary.ADMIN,
        ),
      ).rejects.toBeInstanceOf(BadRequestException)

      expect(aws.deleteObject).not.toHaveBeenCalled()
    })
  })

  describe('cleanup', () => {
    it('deletes the staged object from the DOE imports bucket', async () => {
      aws.deleteObject.mockResolvedValue(ResultWrapper.ok())

      await service.cleanup(ADMIN_KEY, ImportUploadBoundary.ADMIN)

      expect(aws.deleteObject).toHaveBeenCalledWith(ADMIN_KEY, BUCKET)
    })

    /**
     * The controllers reach `cleanup` from `catch`/`finally` blocks that are
     * now entered on the invalid-key path too, because the download moved
     * inside the gated service call. Without this check a malformed key would
     * travel from the request body straight to `deleteObject`.
     */
    it('refuses a key outside the boundary prefix instead of deleting it', async () => {
      await service.cleanup(
        'doe-imports/admin/../../etc/passwd',
        ImportUploadBoundary.ADMIN,
      )

      expect(aws.deleteObject).not.toHaveBeenCalled()
      expect(mockLogger.warn).toHaveBeenCalled()
    })

    /** Cross-boundary too: an admin route may not delete an application upload. */
    it('refuses a well-formed key from a different boundary', async () => {
      await service.cleanup(
        'doe-imports/application/11111111-2222-3333-4444-555555555555.xlsx',
        ImportUploadBoundary.ADMIN,
      )

      expect(aws.deleteObject).not.toHaveBeenCalled()
    })

    /**
     * It runs while another error is in flight, so a throw here would replace
     * the error the client is owed.
     */
    it('does not throw on a refused key', async () => {
      await expect(
        service.cleanup('nope', ImportUploadBoundary.ADMIN),
      ).resolves.toBeUndefined()
    })

    it('swallows delete failures (best-effort) and logs a warning', async () => {
      aws.deleteObject.mockRejectedValue(new Error('S3 down'))

      await expect(
        service.cleanup(ADMIN_KEY, ImportUploadBoundary.ADMIN),
      ).resolves.toBeUndefined()
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

      await service.cleanup(key, ImportUploadBoundary.ADMIN)
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

    it('fetchWorkbook rejects an oversized file already on disk', async () => {
      const path = localPathFor(ADMIN_KEY)
      await mkdir(LOCAL_UPLOAD_DIR, { recursive: true })
      // Sparse: stat() reports the full length without writing 20MB, so this
      // only passes if the size is checked before the file is read.
      await writeFile(path, '')
      await truncate(path, MAX_UPLOAD_BYTES + 1)

      try {
        await expect(
          service.fetchWorkbook(ADMIN_KEY, ImportUploadBoundary.ADMIN),
        ).rejects.toBeInstanceOf(PayloadTooLargeException)
        // Rejected from stat() alone — the point is that the bytes are never
        // pulled into memory, which the post-download backstop cannot give us.
        expect(mockReadFile).not.toHaveBeenCalled()
      } finally {
        await rm(path, { force: true })
      }
    })

    it('removes an oversized staged file after rejecting it', async () => {
      const path = localPathFor(ADMIN_KEY)
      await mkdir(LOCAL_UPLOAD_DIR, { recursive: true })
      await writeFile(path, '')
      await truncate(path, MAX_UPLOAD_BYTES + 1)

      try {
        await expect(
          service.fetchWorkbook(ADMIN_KEY, ImportUploadBoundary.ADMIN),
        ).rejects.toBeInstanceOf(PayloadTooLargeException)

        await expect(stat(path)).rejects.toThrow()
      } finally {
        await rm(path, { force: true })
      }
    })
  })

  it('storeLocalUpload is disabled when a bucket is configured', async () => {
    await expect(
      service.storeLocalUpload(ADMIN_KEY, Buffer.from('x')),
    ).rejects.toBeInstanceOf(BadRequestException)
  })
})
