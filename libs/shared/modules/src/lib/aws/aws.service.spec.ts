import { HttpException } from '@nestjs/common'

import { AWSService } from './aws.service'

// The service builds `new S3Client(...)` / `new SESv2Client(...)` as field
// initialisers, so the SDK has to be mocked before the module is imported.
// `s3Send` is only dereferenced when the mock is *called*, never while the
// factory itself runs, so the hoisted factory does not touch it in its TDZ.
jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: (...args: Array<unknown>) => s3Send(...args),
  })),
  GetObjectCommand: jest.fn().mockImplementation((input) => ({ input })),
  PutObjectCommand: jest.fn(),
  DeleteObjectCommand: jest.fn(),
  AbortMultipartUploadCommand: jest.fn(),
  CompleteMultipartUploadCommand: jest.fn(),
  CreateMultipartUploadCommand: jest.fn(),
  UploadPartCommand: jest.fn(),
}))

jest.mock('@aws-sdk/client-sesv2', () => ({
  SESv2Client: jest.fn().mockImplementation(() => ({})),
  SendEmailCommand: jest.fn(),
}))

jest.mock('@aws-sdk/credential-providers', () => ({
  fromIni: jest.fn(),
}))

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn().mockResolvedValue('https://s3/signed'),
}))

const s3Send = jest.fn()

const ONE_MB = 1024 * 1024
const CAP = ONE_MB * 20

const BUCKET = 'test-bucket'
const KEY = 'doe-imports/admin/workbook.xlsx'

/**
 * `@LogAndHandle` turns a thrown HttpException into `ResultWrapper.err`, and
 * `unwrap()` rethrows it as an HttpException carrying the same status — so this
 * is what a caller of getObjectBuffer actually sees.
 */
const thrownBy = (result: { unwrap: () => unknown }): HttpException => {
  try {
    result.unwrap()
  } catch (error) {
    return error as HttpException
  }

  throw new Error('expected unwrap() to throw')
}

const statusOf = (result: { unwrap: () => unknown }) =>
  thrownBy(result).getStatus()

const messageOf = (result: { unwrap: () => unknown }) =>
  thrownBy(result).message

const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

/**
 * A stand-in for the SDK's `SdkStream` body: async-iterable, destroyable, and
 * instrumented so a test can assert whether it was iterated at all and how many
 * chunks were actually pulled off it.
 */
const makeBody = (
  chunkSizes: Array<number>,
  // `null` builds a body with no `destroy` key at all — the shape the `typeof`
  // probe in destroyResponseBody exists for. It cannot be `undefined`: that
  // triggers the default parameter and silently gives the body a destroy again.
  destroy: jest.Mock | null = jest.fn(),
) => {
  const body = {
    ...(destroy ? { destroy } : {}),
    iterated: false,
    pulled: 0,
    [Symbol.asyncIterator]() {
      body.iterated = true
      let index = 0

      return {
        next: async (): Promise<IteratorResult<Uint8Array>> => {
          if (index >= chunkSizes.length) {
            return { done: true, value: undefined }
          }

          const size = chunkSizes[index++]
          body.pulled += 1

          return { done: false, value: Buffer.alloc(size) }
        },
        return: async (): Promise<IteratorResult<Uint8Array>> => ({
          done: true,
          value: undefined,
        }),
      }
    },
  }

  return body
}

describe('AWSService.getObjectBuffer', () => {
  let service: AWSService

  beforeAll(() => {
    // getS3Bucket() reads this; every test passes an explicit bucket, but keep
    // the env deterministic regardless.
    process.env.AWS_APPLICATION_FILES_BUCKET = BUCKET
  })

  afterAll(() => {
    delete process.env.AWS_APPLICATION_FILES_BUCKET
  })

  beforeEach(() => {
    jest.clearAllMocks()
    service = new AWSService(mockLogger as never)
  })

  it('rejects an over-cap Content-Length without reading a single chunk', async () => {
    const body = makeBody([ONE_MB])
    s3Send.mockResolvedValue({ Body: body, ContentLength: CAP + 1 })

    const result = await service.getObjectBuffer(KEY, BUCKET, {
      maxBytes: CAP,
    })

    expect(result.isOk()).toBe(false)
    // The whole point of the cheap path: no bytes are read.
    expect(body.iterated).toBe(false)
    expect(body.pulled).toBe(0)
    expect(body.destroy).toHaveBeenCalledTimes(1)
  })

  it('surfaces the rejection as a 413', async () => {
    s3Send.mockResolvedValue({
      Body: makeBody([ONE_MB]),
      ContentLength: CAP + 1,
    })

    const result = await service.getObjectBuffer(KEY, BUCKET, {
      maxBytes: CAP,
    })

    expect(result.isOk()).toBe(false)
    expect(thrownBy(result)).toBeInstanceOf(HttpException)
    expect(statusOf(result)).toBe(413)
    expect(messageOf(result)).toBe(
      'Object exceeds the maximum allowed size of 20MB',
    )
  })

  it('rejects mid-stream when Content-Length is absent', async () => {
    // 8MB chunks: the cap is blown on the third pull (24MB > 20MB).
    const body = makeBody([8 * ONE_MB, 8 * ONE_MB, 8 * ONE_MB, 8 * ONE_MB])
    s3Send.mockResolvedValue({ Body: body })

    const result = await service.getObjectBuffer(KEY, BUCKET, {
      maxBytes: CAP,
    })

    expect(result.isOk()).toBe(false)
    expect(body.pulled).toBe(3)
    expect(body.destroy).toHaveBeenCalledTimes(1)
    // Pin the status here too, not only on the Content-Length path — this
    // branch degrading to a 500 would otherwise go unnoticed.
    expect(statusOf(result)).toBe(413)
    expect(messageOf(result)).toBe(
      'Object exceeds the maximum allowed size of 20MB',
    )
  })

  it('rejects mid-stream at exactly one byte over the cap', async () => {
    const body = makeBody([10 * ONE_MB, 10 * ONE_MB, 1])
    s3Send.mockResolvedValue({ Body: body })

    const result = await service.getObjectBuffer(KEY, BUCKET, {
      maxBytes: CAP,
    })

    expect(result.isOk()).toBe(false)
    expect(statusOf(result)).toBe(413)
    expect(body.pulled).toBe(3)
    expect(body.destroy).toHaveBeenCalledTimes(1)
  })

  it('accepts an under-cap object when Content-Length is absent', async () => {
    const body = makeBody([ONE_MB, ONE_MB])
    s3Send.mockResolvedValue({ Body: body })

    const result = await service.getObjectBuffer(KEY, BUCKET, {
      maxBytes: CAP,
    })

    expect(result.isOk()).toBe(true)
    expect(result.unwrap().length).toBe(2 * ONE_MB)
    expect(body.destroy).not.toHaveBeenCalled()
  })

  it('rejects mid-stream when Content-Length understates the object', async () => {
    const body = makeBody([8 * ONE_MB, 8 * ONE_MB, 8 * ONE_MB, 8 * ONE_MB])
    s3Send.mockResolvedValue({ Body: body, ContentLength: 1024 })

    const result = await service.getObjectBuffer(KEY, BUCKET, {
      maxBytes: CAP,
    })

    expect(result.isOk()).toBe(false)
    expect(body.pulled).toBe(3)
    expect(body.destroy).toHaveBeenCalledTimes(1)
  })

  it('accepts an object exactly at the cap', async () => {
    const body = makeBody([10 * ONE_MB, 10 * ONE_MB])
    s3Send.mockResolvedValue({ Body: body, ContentLength: CAP })

    const result = await service.getObjectBuffer(KEY, BUCKET, {
      maxBytes: CAP,
    })

    expect(result.isOk()).toBe(true)
    expect(result.unwrap().length).toBe(CAP)
    expect(body.destroy).not.toHaveBeenCalled()
  })

  it('does not cap anything when no maxBytes is given', async () => {
    const body = makeBody([8 * ONE_MB, 8 * ONE_MB, 8 * ONE_MB])
    s3Send.mockResolvedValue({ Body: body, ContentLength: 24 * ONE_MB })

    const result = await service.getObjectBuffer(KEY, BUCKET)

    expect(result.isOk()).toBe(true)
    expect(result.unwrap().length).toBe(24 * ONE_MB)
    expect(body.pulled).toBe(3)
    expect(body.destroy).not.toHaveBeenCalled()
  })

  it('still rejects when the body carries no destroy function', async () => {
    const body = makeBody([ONE_MB], null)
    s3Send.mockResolvedValue({ Body: body, ContentLength: CAP + 1 })

    const result = await service.getObjectBuffer(KEY, BUCKET, {
      maxBytes: CAP,
    })

    expect(statusOf(result)).toBe(413)
    expect(body.iterated).toBe(false)
    // An absent `destroy` is an expected shape, not a failure: the typeof probe
    // means we never call it and never log a spurious abort warning.
    expect(mockLogger.warn).not.toHaveBeenCalledWith(
      'Failed to destroy S3 response stream',
      expect.anything(),
    )
  })

  it('still surfaces the 413 when destroying the body throws', async () => {
    const destroy = jest.fn(() => {
      throw new Error('socket already gone')
    })
    const body = makeBody([ONE_MB], destroy)
    s3Send.mockResolvedValue({ Body: body, ContentLength: CAP + 1 })

    const result = await service.getObjectBuffer(KEY, BUCKET, {
      maxBytes: CAP,
    })

    // The destroy failure is logged, never allowed to replace the 413.
    expect(statusOf(result)).toBe(413)
    expect(destroy).toHaveBeenCalledTimes(1)
    expect(mockLogger.warn).toHaveBeenCalledWith(
      'Failed to destroy S3 response stream',
      expect.objectContaining({ error: expect.any(Error) }),
    )
  })
})
