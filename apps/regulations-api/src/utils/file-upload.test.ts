import type { Request as ExpressRequest } from 'express'

/**
 * CHARACTERIZATION TESTS for `getKey()` — the S3 object key generator for
 * every media upload.
 *
 * These assertions describe the algorithm **as it is today**, warts included
 * (see the `undefined` folder segment below). They are not a specification of
 * what the key *should* look like — they are a record of what is already
 * sitting in the bucket. Every string here is a live URL for some regulation's
 * images. If a refactor changes one of them, previously-uploaded media 404s.
 *
 * So: do not "fix" a failing expectation here by updating the expected string.
 * A red test means the refactor broke a production URL.
 */

// `misc.ts` reads FILE_UPLOAD_KEY_* and `constants.ts` reads
// MEDIA_BUCKET_FOLDER at *module load*, so every variation has to reload the
// module graph rather than just poking process.env.
const API_KEYS = {
  FILE_UPLOAD_KEY_DRAFT: 'test-draft-key',
  FILE_UPLOAD_KEY_PUBLISH: 'test-publish-key',
  FILE_UPLOAD_KEY_PRESIGNED: 'test-presigned-key',
}

const ENV_KEYS = [
  'FILE_UPLOAD_KEY_DRAFT',
  'FILE_UPLOAD_KEY_PUBLISH',
  'FILE_UPLOAD_KEY_PRESIGNED',
  'MEDIA_BUCKET_FOLDER',
] as const

let savedEnv: Record<string, string | undefined> = {}

beforeEach(() => {
  savedEnv = {}
  ENV_KEYS.forEach((key) => {
    savedEnv[key] = process.env[key]
    delete process.env[key]
  })
})

afterEach(() => {
  ENV_KEYS.forEach((key) => {
    if (savedEnv[key] === undefined) {
      delete process.env[key]
    } else {
      process.env[key] = savedEnv[key]
    }
  })
})

type GetKey = (req: ExpressRequest, file: FakeFile) => string

const loadGetKey = (env: Record<string, string> = API_KEYS): GetKey => {
  jest.resetModules()
  Object.entries(env).forEach(([key, value]) => {
    process.env[key] = value
  })
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return (require('./file-upload') as { getKey: GetKey }).getKey
}

type FakeFile = {
  originalname: string
  $hash$?: string
  isPasted?: boolean
}

const makeReq = (
  query: Record<string, string | Array<string>> = {},
  headers: Record<string, string> = {},
): ExpressRequest => ({ query, headers } as unknown as ExpressRequest)

const makeFile = (originalname: string, $hash$?: string): FakeFile =>
  $hash$ === undefined ? { originalname } : { originalname, $hash$ }

// ---------------------------------------------------------------------------

describe('getKey — folder resolution', () => {
  it('emits a LITERAL "undefined" folder segment when no folder can be derived', () => {
    // `ensureFileScopeToken('')` returns `undefined`, which the template
    // literal stringifies. This is ugly but it is the shipped behaviour, and
    // real objects live under `files/undefined/`.
    const getKey = loadGetKey()

    expect(getKey(makeReq(), makeFile('barchart.png'))).toBe(
      'files/undefined/barchart.png',
    )
  })

  it('uses an explicit ?folder= override', () => {
    const getKey = loadGetKey()

    expect(getKey(makeReq({ folder: 'foo' }), makeFile('barchart.png'))).toBe(
      'files/foo/barchart.png',
    )
  })

  it('derives the folder from ?scope= as the slugified regname (slash becomes dash)', () => {
    const getKey = loadGetKey()

    expect(
      getKey(makeReq({ scope: '0123/2021' }), makeFile('barchart.png')),
    ).toBe('files/0123-2021/barchart.png')
  })

  it('prefers ?folder= over ?scope= when both are present', () => {
    const getKey = loadGetKey()

    expect(
      getKey(
        makeReq({ folder: 'explicit', scope: '0123/2021' }),
        makeFile('barchart.png'),
      ),
    ).toBe('files/explicit/barchart.png')
  })

  it('takes the first entry when ?folder= arrives as an array', () => {
    const getKey = loadGetKey()

    expect(
      getKey(
        makeReq({ folder: ['first-folder', 'second-folder'] }),
        makeFile('barchart.png'),
      ),
    ).toBe('files/first-folder/barchart.png')
  })

  it('takes the first entry when ?scope= arrives as an array', () => {
    const getKey = loadGetKey()

    expect(
      getKey(
        makeReq({ scope: ['0123/2021', '0456/2022'] }),
        makeFile('barchart.png'),
      ),
    ).toBe('files/0123-2021/barchart.png')
  })

  it('rejects a folder that is not a safe file-scope token, falling back to "undefined"', () => {
    const getKey = loadGetKey()

    // path traversal, spaces and single characters are all refused by
    // `ensureFileScopeToken`
    expect(
      getKey(makeReq({ folder: '../etc' }), makeFile('barchart.png')),
    ).toBe('files/undefined/barchart.png')
    expect(
      getKey(makeReq({ folder: 'has space' }), makeFile('barchart.png')),
    ).toBe('files/undefined/barchart.png')
    expect(getKey(makeReq({ folder: 'x' }), makeFile('barchart.png'))).toBe(
      'files/undefined/barchart.png',
    )
  })

  it('rejects a malformed ?scope= (not a RegName) and falls back to "undefined"', () => {
    const getKey = loadGetKey()

    expect(getKey(makeReq({ scope: 'not-a-regname' }), makeFile('a.png'))).toBe(
      'files/undefined/a.png',
    )
  })
})

describe('getKey — filename handling', () => {
  it('keeps the basename case but lowercases the extension', () => {
    const getKey = loadGetKey()

    expect(
      getKey(makeReq({ folder: 'foo' }), makeFile('BarChart.PNG')),
    ).toBe('files/foo/BarChart.png')
  })

  it('appends the content hash between basename and extension', () => {
    const getKey = loadGetKey()

    expect(
      getKey(makeReq({ folder: 'foo' }), makeFile('barchart.png', 'abcd1234')),
    ).toBe('files/foo/barchart--abcd1234.png')
  })

  it('strips any directory component from originalname', () => {
    const getKey = loadGetKey()

    expect(getKey(makeReq({ folder: 'foo' }), makeFile('a/b/c.png'))).toBe(
      'files/foo/c.png',
    )
  })

  it('only strips the LAST extension from a multi-dot name', () => {
    const getKey = loadGetKey()

    expect(
      getKey(makeReq({ folder: 'foo' }), makeFile('my.report.v2.PDF')),
    ).toBe('files/foo/my.report.v2.pdf')
  })

  it('handles an extensionless filename', () => {
    const getKey = loadGetKey()

    expect(getKey(makeReq({ folder: 'foo' }), makeFile('README'))).toBe(
      'files/foo/README',
    )
  })

  it('returns a path with a trailing slash (NOT undefined) for an empty originalname', () => {
    // Divergence from `_generateFileKey()` in upload.ts, which returns
    // `undefined` for an empty name. `createPresigned` relies on that
    // `undefined`; this function has no such guard and hands multer-s3 a key
    // ending in "/". Pinned so a refactor cannot silently unify the two.
    const getKey = loadGetKey()

    expect(getKey(makeReq({ folder: 'foo' }), makeFile(''))).toBe('files/foo/')
  })
})

describe('getKey — pasted blob normalization', () => {
  it('rewrites blobidNNN.png to image.png AND sets file.isPasted', () => {
    const getKey = loadGetKey()
    const file = makeFile('blobid12345.png')

    // `pasted--image.png` first, then the `pasted--` prefix is stripped again.
    expect(getKey(makeReq({ folder: 'foo' }), file)).toBe('files/foo/image.png')

    // Load-bearing: multer-s3-transform reads `isPasted` in `shouldTransform`
    // to decide whether to run the PNG -> JPEG flatten. If this mutation is
    // lost, pasted screenshots stop being converted and bloat the bucket.
    expect(file.isPasted).toBe(true)
  })

  it('does not set isPasted for an ordinary file', () => {
    const getKey = loadGetKey()
    const file = makeFile('barchart.png')

    getKey(makeReq({ folder: 'foo' }), file)

    expect(file.isPasted).toBeUndefined()
  })

  it('strips an explicit "pasted--image" prefix and flags the file', () => {
    const getKey = loadGetKey()
    const file = makeFile('pasted--image.png')

    expect(getKey(makeReq({ folder: 'foo' }), file)).toBe('files/foo/image.png')
    expect(file.isPasted).toBe(true)
  })

  it('keeps the hash on a pasted blob', () => {
    const getKey = loadGetKey()
    const file = makeFile('blobid98765.png', 'deadbeef')

    expect(getKey(makeReq({ folder: 'foo' }), file)).toBe(
      'files/foo/image--deadbeef.png',
    )
    expect(file.isPasted).toBe(true)
  })

  it('does not treat a blobid name with a non-png extension as pasted', () => {
    const getKey = loadGetKey()
    const file = makeFile('blobid12345.jpg')

    expect(getKey(makeReq({ folder: 'foo' }), file)).toBe(
      'files/foo/blobid12345.jpg',
    )
    expect(file.isPasted).toBeUndefined()
  })
})

describe('getKey — rootFolder from the X-APIKey upload type', () => {
  it("puts 'draft' uploads under DRAFTS_FOLDER (admin-drafts)", () => {
    const getKey = loadGetKey()

    expect(
      getKey(
        makeReq({ folder: 'foo' }, { 'x-apikey': API_KEYS.FILE_UPLOAD_KEY_DRAFT }),
        makeFile('barchart.png'),
      ),
    ).toBe('admin-drafts/files/foo/barchart.png')
  })

  it("gives 'publish' uploads no root folder", () => {
    const getKey = loadGetKey()

    expect(
      getKey(
        makeReq(
          { folder: 'foo' },
          { 'x-apikey': API_KEYS.FILE_UPLOAD_KEY_PUBLISH },
        ),
        makeFile('barchart.png'),
      ),
    ).toBe('files/foo/barchart.png')
  })

  it("gives 'presigned' uploads no root folder", () => {
    const getKey = loadGetKey()

    expect(
      getKey(
        makeReq(
          { folder: 'foo' },
          { 'x-apikey': API_KEYS.FILE_UPLOAD_KEY_PRESIGNED },
        ),
        makeFile('barchart.png'),
      ),
    ).toBe('files/foo/barchart.png')
  })

  it('gives an unknown API key no root folder', () => {
    const getKey = loadGetKey()

    expect(
      getKey(
        makeReq({ folder: 'foo' }, { 'x-apikey': 'nope-not-a-key' }),
        makeFile('barchart.png'),
      ),
    ).toBe('files/foo/barchart.png')
  })

  it('does not treat the placeholder "_" as a draft key when the draft env var is unset', () => {
    // `misc.ts` deletes the EMPTY_KEY entry so missing env vars cannot open a
    // security hole. Verify the hole stays shut.
    const getKey = loadGetKey({
      FILE_UPLOAD_KEY_PUBLISH: API_KEYS.FILE_UPLOAD_KEY_PUBLISH,
    })

    expect(
      getKey(
        makeReq({ folder: 'foo' }, { 'x-apikey': '_' }),
        makeFile('barchart.png'),
      ),
    ).toBe('files/foo/barchart.png')
  })
})

describe('getKey — MEDIA_BUCKET_FOLDER (devFolder) segment', () => {
  it('omits the segment when MEDIA_BUCKET_FOLDER is unset', () => {
    const getKey = loadGetKey()

    expect(getKey(makeReq({ folder: 'foo' }), makeFile('barchart.png'))).toBe(
      'files/foo/barchart.png',
    )
  })

  it('prefixes the segment when MEDIA_BUCKET_FOLDER is set', () => {
    const getKey = loadGetKey({ ...API_KEYS, MEDIA_BUCKET_FOLDER: 'dev' })

    expect(getKey(makeReq({ folder: 'foo' }), makeFile('barchart.png'))).toBe(
      'dev/files/foo/barchart.png',
    )
  })

  it('composes devFolder + rootFolder + folder in that order', () => {
    const getKey = loadGetKey({ ...API_KEYS, MEDIA_BUCKET_FOLDER: 'dev' })

    expect(
      getKey(
        makeReq(
          { scope: '0123/2021' },
          { 'x-apikey': API_KEYS.FILE_UPLOAD_KEY_DRAFT },
        ),
        makeFile('blobid1.png', 'cafebabe'),
      ),
    ).toBe('dev/admin-drafts/files/0123-2021/image--cafebabe.png')
  })

  it('collapses double slashes and strips the leading slash', () => {
    // Every empty segment above is what produces the doubled slashes, so this
    // asserts on the raw shape: no leading "/", no "//" anywhere.
    const getKey = loadGetKey()
    const key = getKey(makeReq(), makeFile('barchart.png'))

    expect(key.startsWith('/')).toBe(false)
    expect(key).not.toContain('//')
    expect(key).toBe('files/undefined/barchart.png')
  })
})

// ---------------------------------------------------------------------------
// The PNG -> JPEG transform
// ---------------------------------------------------------------------------

/**
 * CHARACTERIZATION of the pasted-image transform.
 *
 * `getKey()` is only half the story. For a pasted blob the object actually
 * written to S3 has its `.png` rewritten to `.jpg`, and the route returns THAT
 * key as the `location`. So `getKey` naming `…/image.png` while the bucket
 * holds `…/image.jpg` is correct and intended — and a rewrite that returns the
 * `getKey` value as the location 404s every pasted image.
 *
 * PROVENANCE OF THESE STRINGS: captured by executing the pre-rewrite
 * `multer-s3-transform` implementation (its `transforms[0].key` callback) taken
 * from commit c937fbda, not derived from the current code. The old
 * implementation expressed this as a storage-object callback and the current
 * one as `toTransformedKey`; the keys are identical either way, which is
 * exactly what must stay true.
 */
describe('the pasted-PNG to JPEG key rewrite', () => {
  const load = (env: Record<string, string> = API_KEYS) => {
    jest.resetModules()
    Object.entries(env).forEach(([key, value]) => {
      process.env[key] = value
    })
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('./file-upload') as {
      getKey: GetKey
      toTransformedKey: (key: string) => string
    }
  }

  it('stores a pasted blob as .jpg even though getKey names it .png', () => {
    // THE RELATIONSHIP, in one test. Both halves asserted together so the
    // dependency between them is impossible to miss.
    const { getKey, toTransformedKey } = load()
    const req = makeReq({ folder: 'foo' })

    const named = getKey(req, makeFile('blobid12345.png'))
    expect(named).toBe('files/foo/image.png')

    expect(toTransformedKey(named)).toBe('files/foo/image.jpg')
  })

  it('keeps the hash across the extension rewrite', () => {
    const { getKey, toTransformedKey } = load()

    expect(
      toTransformedKey(
        getKey(
          makeReq({ folder: 'foo' }),
          makeFile('blobid12345.png', 'cafebabe'),
        ),
      ),
    ).toBe('files/foo/image--cafebabe.jpg')
  })

  it('rewrites the extension unconditionally — gating is isPasted alone', () => {
    // The rewrite does not look at `isPasted`; it rewrites any .png. The ONLY
    // thing that stops an ordinary PNG being flattened to JPEG is the
    // `isPasted` check at the call site. A refactor that folds the gate into
    // the key function, or drops it, changes which objects exist in S3.
    const { getKey, toTransformedKey } = load()
    const req = makeReq({ folder: 'foo' })

    const file = makeFile('plain.png')
    expect(toTransformedKey(getKey(req, file))).toBe('files/foo/plain.jpg')
    // ...but this file is not pasted, so nothing ever asks for that key.
    expect(file.isPasted).toBeUndefined()
  })

  it('leaves a non-png extension untouched', () => {
    const { getKey, toTransformedKey } = load()

    expect(
      toTransformedKey(
        getKey(makeReq({ folder: 'foo' }), makeFile('photo.jpeg')),
      ),
    ).toBe('files/foo/photo.jpeg')
  })

  it('only the pasted file gets its key rewritten, and getKey is what decides', () => {
    // `isPasted` is set as a side effect of `getKey`, and it is the sole input
    // to the transform decision. Pinning both files side by side makes the
    // asymmetry explicit.
    const { getKey, toTransformedKey } = load()
    const req = makeReq({ folder: 'foo' })

    const pasted = makeFile('blobid12345.png')
    const ordinary = makeFile('barchart.png')

    const pastedKey = getKey(req, pasted)
    const ordinaryKey = getKey(req, ordinary)

    expect(pasted.isPasted).toBe(true)
    expect(ordinary.isPasted).toBeUndefined()

    // Stored key = transformed for the pasted one, untouched for the other.
    expect(pasted.isPasted ? toTransformedKey(pastedKey) : pastedKey).toBe(
      'files/foo/image.jpg',
    )
    expect(
      ordinary.isPasted ? toTransformedKey(ordinaryKey) : ordinaryKey,
    ).toBe('files/foo/barchart.png')
  })
})

describe('the two candidate `location` values for a pasted upload', () => {
  it('differ, so returning the wrong one yields a URL that 404s', () => {
    // The route builds `location` as FILE_SERVER + '/' + <stored key>. These
    // are the two URLs that choice selects between; they are not
    // interchangeable, and only the .jpg one exists in the bucket.
    jest.resetModules()
    Object.entries(API_KEYS).forEach(([key, value]) => {
      process.env[key] = value
    })
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { getKey, toTransformedKey } = require('./file-upload') as {
      getKey: GetKey
      toTransformedKey: (key: string) => string
    }
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { FILE_SERVER } = require('../constants') as { FILE_SERVER: string }

    const named = getKey(makeReq({ folder: 'foo' }), makeFile('blobid12345.png'))
    const stored = toTransformedKey(named)

    expect(FILE_SERVER + '/' + stored).toBe(
      'https://files.reglugerd.is/files/foo/image.jpg',
    )
    expect(FILE_SERVER + '/' + named).toBe(
      'https://files.reglugerd.is/files/foo/image.png',
    )
    expect(stored).not.toBe(named)
  })
})

