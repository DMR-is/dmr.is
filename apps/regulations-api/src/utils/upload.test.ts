/**
 * CHARACTERIZATION TESTS for `_generateFileKey()` — the presigned-POST key
 * generator.
 *
 * This function LOOKS like a copy of `getKey()` in `file-upload.ts`, and most
 * of the string-munging is indeed identical. It is not interchangeable with
 * it, and the two must not be merged without deciding what to do about the
 * differences pinned at the bottom of this file:
 *
 *   1. an empty name returns `undefined` here, but a trailing-slash path from
 *      `getKey()` — `createPresigned()` depends on the `undefined` for its
 *      `if (!key)` guard (upload.ts:64)
 *   2. `rootFolder` is a plain argument here with no default, so omitting it
 *      interpolates the literal string "undefined" into the key
 *   3. there is no file object, so no `isPasted` flag is ever set
 */

const ENV_KEYS = ['MEDIA_BUCKET_FOLDER'] as const

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

type GenerateFileKey = (
  name?: string,
  rootFolder?: string,
  folderToken?: string,
  hash?: string,
) => string | undefined

// `constants.ts` reads MEDIA_BUCKET_FOLDER at module load.
const load = (env: Record<string, string> = {}): GenerateFileKey => {
  jest.resetModules()
  Object.entries(env).forEach(([key, value]) => {
    process.env[key] = value
  })
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return (require('./upload') as { _generateFileKey: GenerateFileKey })
    ._generateFileKey
}

// ---------------------------------------------------------------------------

describe('_generateFileKey — the createPresigned guard contract', () => {
  it('returns undefined for an empty name', () => {
    // `createPresigned()` checks `if (!key)` and bails with null. Losing this
    // `undefined` would send an empty-keyed presigned POST to S3.
    const generate = load()

    expect(generate('', 'admin-drafts', 'foo', 'abcd1234')).toBeUndefined()
  })

  it('returns undefined when the name is omitted entirely', () => {
    const generate = load()

    expect(generate(undefined, 'admin-drafts', 'foo')).toBeUndefined()
  })

  it('returns a key for any non-empty name, even one that is only an extension', () => {
    const generate = load()

    // Guard is `!name`, not "has a basename" — '.gitignore' passes.
    expect(generate('.gitignore', 'root', 'foo')).toBe('root/files/foo/.gitignore')
  })
})

describe('_generateFileKey — rootFolder handling', () => {
  it('interpolates the LITERAL string "undefined" when rootFolder is omitted', () => {
    // No default and no guard: the template literal stringifies `undefined`.
    // This is the shipped behaviour and presigned uploads made without a
    // rootFolder are sitting under a real `undefined/` prefix in the bucket.
    const generate = load()

    expect(generate('barchart.png', undefined, 'foo')).toBe(
      'undefined/files/foo/barchart.png',
    )
  })

  it('drops an empty-string rootFolder cleanly', () => {
    const generate = load()

    expect(generate('barchart.png', '', 'foo')).toBe('files/foo/barchart.png')
  })

  it('uses the rootFolder verbatim when supplied', () => {
    const generate = load()

    expect(generate('barchart.png', 'admin-drafts', 'foo')).toBe(
      'admin-drafts/files/foo/barchart.png',
    )
  })
})

describe('_generateFileKey — folder token handling', () => {
  it('emits a literal "undefined" folder segment for a missing folderToken', () => {
    const generate = load()

    expect(generate('barchart.png', '')).toBe(
      'files/undefined/barchart.png',
    )
  })

  it('emits a literal "undefined" folder segment for an unsafe folderToken', () => {
    const generate = load()

    expect(generate('barchart.png', '', '../etc')).toBe(
      'files/undefined/barchart.png',
    )
  })

  it('accepts a slugified regname as the folder token', () => {
    const generate = load()

    expect(generate('barchart.png', '', '0123-2021')).toBe(
      'files/0123-2021/barchart.png',
    )
  })
})

describe('_generateFileKey — filename handling', () => {
  it('lowercases the extension and keeps the basename case', () => {
    const generate = load()

    expect(generate('BarChart.PNG', '', 'foo')).toBe('files/foo/BarChart.png')
  })

  it('appends the hash between basename and extension', () => {
    const generate = load()

    expect(generate('barchart.png', '', 'foo', 'abcd1234')).toBe(
      'files/foo/barchart--abcd1234.png',
    )
  })

  it('strips any directory component from the name', () => {
    const generate = load()

    expect(generate('a/b/c.png', '', 'foo')).toBe('files/foo/c.png')
  })

  it('normalizes blobidNNN.png to image.png', () => {
    const generate = load()

    expect(generate('blobid12345.png', '', 'foo')).toBe('files/foo/image.png')
  })

  it('only strips the last extension from a multi-dot name', () => {
    const generate = load()

    expect(generate('my.report.v2.PDF', '', 'foo')).toBe(
      'files/foo/my.report.v2.pdf',
    )
  })
})

describe('_generateFileKey — MEDIA_BUCKET_FOLDER (devFolder) segment', () => {
  it('omits the segment when unset', () => {
    const generate = load()

    expect(generate('barchart.png', '', 'foo')).toBe('files/foo/barchart.png')
  })

  it('prefixes the segment when set', () => {
    const generate = load({ MEDIA_BUCKET_FOLDER: 'dev' })

    expect(generate('barchart.png', '', 'foo')).toBe(
      'dev/files/foo/barchart.png',
    )
  })

  it('composes devFolder + rootFolder + folder + hashed name', () => {
    const generate = load({ MEDIA_BUCKET_FOLDER: 'dev' })

    expect(
      generate('blobid1.png', 'admin-drafts', '0123-2021', 'cafebabe'),
    ).toBe('dev/admin-drafts/files/0123-2021/image--cafebabe.png')
  })
})

describe('_generateFileKey vs getKey — the divergences that must survive a refactor', () => {
  it('agrees with getKey on an ordinary hashed upload', () => {
    const generate = load()
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { getKey } = require('./file-upload') as {
      getKey: (
        req: unknown,
        file: { originalname: string; $hash$?: string },
      ) => string
    }

    const viaGetKey = getKey(
      { query: { folder: 'foo' }, headers: {} },
      { originalname: 'barchart.png', $hash$: 'abcd1234' },
    )

    expect(generate('barchart.png', '', 'foo', 'abcd1234')).toBe(viaGetKey)
    expect(viaGetKey).toBe('files/foo/barchart--abcd1234.png')
  })

  it('DISAGREES with getKey on an empty name: undefined here, a path there', () => {
    const generate = load()
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { getKey } = require('./file-upload') as {
      getKey: (req: unknown, file: { originalname: string }) => string
    }

    expect(generate('', '', 'foo')).toBeUndefined()
    expect(
      getKey({ query: { folder: 'foo' }, headers: {} }, { originalname: '' }),
    ).toBe('files/foo/')
  })

  it('does not flag pasted blobs — there is no file object to mutate', () => {
    const generate = load()

    // Same key as getKey produces, but the PNG -> JPEG transform that getKey
    // enables via `file.isPasted` has no equivalent on the presigned path.
    expect(generate('blobid12345.png', '', 'foo')).toBe('files/foo/image.png')
  })
})
