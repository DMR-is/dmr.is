/**
 * Regression test for the aws-sdk v2 -> v3 port.
 *
 * `AWS_REGION_NAME` falls back to `''` when none of AWS_REGION_NAME /
 * AWS_REGION / AWS_DEFAULT_REGION is set — see `constants.ts`, where the
 * matching throw is deliberately commented out, so the app is expected to keep
 * running in that state.
 *
 * Under aws-sdk v2 that was survivable: `new S3(...)` never threw, the cache
 * read failed inside its own promise, and `_makePublishedPdf` fell through to
 * rendering the PDF without a cache. Under v3, `new S3Client({ region: '' })`
 * throws **synchronously**, so a client built outside the error handler escapes
 * it entirely and `_makePublishedPdf` returns `{}` — no PDF at all, for what is
 * only a caching misconfiguration.
 *
 * The seam this asserts on: if the cache read degrades correctly, execution
 * reaches `getRegulation`; if it throws, the outer catch swallows it and
 * returns `{}`. Mocking `getRegulation` to return an error therefore
 * distinguishes the two without needing puppeteer, Postgres or a real bucket.
 */

const REGION_KEYS = [
  'AWS_REGION_NAME',
  'AWS_REGION',
  'AWS_DEFAULT_REGION',
] as const

describe('makePublishedPdf with no AWS region configured', () => {
  const savedEnv: Record<string, string | undefined> = {}

  beforeEach(() => {
    REGION_KEYS.forEach((key) => {
      savedEnv[key] = process.env[key]
      delete process.env[key]
    })
    // constants.ts also warns when these are unset; keep the rest valid so the
    // region is the only thing missing.
    savedEnv.AWS_BUCKET_NAME = process.env.AWS_BUCKET_NAME
    savedEnv.API_SERVER = process.env.API_SERVER
    process.env.AWS_BUCKET_NAME = 'test-bucket'
    process.env.API_SERVER = 'http://localhost'
    jest.resetModules()
  })

  afterEach(() => {
    Object.entries(savedEnv).forEach(([key, value]) => {
      if (value === undefined) {
        delete process.env[key]
      } else {
        process.env[key] = value
      }
    })
    jest.resetModules()
    jest.restoreAllMocks()
  })

  it('still reaches the render path instead of bailing out with {}', async () => {
    jest.doMock('./Regulation', () => ({
      fetchModifiedDate: jest
        .fn()
        .mockResolvedValue('2026-01-01T00:00:00.000Z'),
      getRegulation: jest.fn().mockResolvedValue({ error: 'sentinel' }),
    }))

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { makePublishedPdf } = require('./RegulationPdf')

    const result = await makePublishedPdf('/pdf/0123-2026', {
      name: '0123-2026',
      date: 'current',
    })

    // `error: 'sentinel'` proves getRegulation was reached, i.e. the cache read
    // degraded to a miss. Before the fix this was `{}`, because the synchronous
    // "Region is missing" throw escaped fetchPdf's handler and was swallowed by
    // the outer catch in _makePublishedPdf.
    expect(result).toEqual({ error: 'sentinel' })
  })

  /**
   * The write path (`uploadPdf`) received the identical fix — client
   * construction moved inside its own try/catch — but is deliberately not
   * asserted here, and is covered by inspection only.
   *
   * Reaching it requires `makeRegulationPdf` to return real contents, which
   * shells out to pagedjs/Chromium and writes to a temp dir; there is no cheap
   * seam short of that. A test that stubbed its way past the renderer would
   * assert the stub, not the containment. Worth knowing if this is ever
   * refactored: an uncontained throw there discards an already-rendered PDF.
   */
})
