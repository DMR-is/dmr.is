import { ResultWrapper } from '@dmr.is/types'

import { CompanyFileService } from './company-file.service'

describe('CompanyFileService', () => {
  const logger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }

  const aws = { uploadObject: jest.fn() }

  let service: CompanyFileService
  const originalBucket = process.env.AWS_DOE_COMPANY_FILES_BUCKET

  beforeEach(() => {
    jest.clearAllMocks()
    process.env.AWS_DOE_COMPANY_FILES_BUCKET = 'doe-company-files'
    service = new CompanyFileService(logger as never, aws as never)
  })

  afterAll(() => {
    if (originalBucket === undefined) {
      delete process.env.AWS_DOE_COMPANY_FILES_BUCKET
    } else {
      process.env.AWS_DOE_COMPANY_FILES_BUCKET = originalBucket
    }
  })

  const upload = (filename = 'launagreining-r1.pdf') => ({
    companyNationalId: '5500000000',
    filename,
    content: Buffer.from('pdf-bytes'),
    issuedAt: new Date('2026-08-31T13:45:00.000Z'),
  })

  it('files the document under company-files/{nationalId}/{date}-{filename}', async () => {
    aws.uploadObject.mockResolvedValue(ResultWrapper.ok('ignored-url'))

    const keys = await service.archive([upload()])

    expect(aws.uploadObject).toHaveBeenCalledWith(
      'doe-company-files',
      'company-files/5500000000/2026-08-31-launagreining-r1.pdf',
      'launagreining-r1.pdf',
      Buffer.from('pdf-bytes'),
    )
    expect(keys).toEqual([
      'company-files/5500000000/2026-08-31-launagreining-r1.pdf',
    ])
  })

  it('files every document in the batch', async () => {
    aws.uploadObject.mockResolvedValue(ResultWrapper.ok('ignored-url'))

    const keys = await service.archive([
      upload('launagreining-r1.pdf'),
      upload('urbotaaetlun-r1.pdf'),
    ])

    expect(keys).toHaveLength(2)
    expect(keys[1]).toBe(
      'company-files/5500000000/2026-08-31-urbotaaetlun-r1.pdf',
    )
  })

  /**
   * Unset locally and until infra provisions the bucket. Archiving is off rather
   * than erroring on every approval.
   */
  it.each([
    ['absent', undefined],
    // How the schema itself writes the key, so this is the shape a declared but
    // unpopulated variable arrives in.
    ['empty', ''],
    ['whitespace', '   '],
  ])('does nothing when the bucket is %s', async (_label, value) => {
    if (value === undefined) {
      delete process.env.AWS_DOE_COMPANY_FILES_BUCKET
    } else {
      process.env.AWS_DOE_COMPANY_FILES_BUCKET = value
    }

    const keys = await service.archive([upload()])

    expect(aws.uploadObject).not.toHaveBeenCalled()
    expect(keys).toEqual([])
    // Not an error — but it must be visible at production's `info` level, or a
    // deployed API silently keeps no copy of what it sent.
    expect(logger.error).not.toHaveBeenCalled()
    expect(logger.warn).toHaveBeenCalled()
  })

  // A padded value should archive to the intended bucket, not fail at S3 with an
  // obscure name error.
  it('trims a padded bucket name rather than using it verbatim', async () => {
    process.env.AWS_DOE_COMPANY_FILES_BUCKET = '  doe-company-files  '
    aws.uploadObject.mockResolvedValue(ResultWrapper.ok('ignored-url'))

    await service.archive([upload()])

    expect(aws.uploadObject).toHaveBeenCalledWith(
      'doe-company-files',
      expect.any(String),
      expect.any(String),
      expect.any(Buffer),
    )
  })

  /**
   * ⚠️ Never throws: callers archive AFTER the document has been delivered, so a
   * storage failure must not surface as a failed decision.
   */
  // ⚠️ A rejection is NOT how `uploadObject` fails — it is
  // `@LogAndHandle()`-decorated and resolves an err result, covered by the test
  // below. This one pins the build-the-call path the catch actually guards.
  it('swallows a throw from building the upload and reports no key for it', async () => {
    aws.uploadObject.mockRejectedValue(new Error('AccessDenied'))

    await expect(service.archive([upload()])).resolves.toEqual([])
    expect(logger.error).toHaveBeenCalled()
  })

  it('swallows a failed ResultWrapper and reports no key for it', async () => {
    aws.uploadObject.mockResolvedValue(
      ResultWrapper.err({ code: 500, message: 'NoSuchBucket' }),
    )

    await expect(service.archive([upload()])).resolves.toEqual([])
    expect(logger.error).toHaveBeenCalled()
  })

  it('keeps the keys that succeeded when one of a batch fails', async () => {
    aws.uploadObject
      .mockResolvedValueOnce(ResultWrapper.ok('ignored-url'))
      .mockRejectedValueOnce(new Error('AccessDenied'))

    const keys = await service.archive([
      upload('launagreining-r1.pdf'),
      upload('urbotaaetlun-r1.pdf'),
    ])

    expect(keys).toEqual([
      'company-files/5500000000/2026-08-31-launagreining-r1.pdf',
    ])
  })
})
