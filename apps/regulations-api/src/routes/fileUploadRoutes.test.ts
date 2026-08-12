import type { FastifyInstance } from 'fastify'

/**
 * ROUTE-LEVEL characterization of `/api/v1/file-presigned`.
 *
 * `upload.test.ts` pins `_generateFileKey()` given an explicit `rootFolder`.
 * That is not enough: the route computes `rootFolder` itself, with a ternary
 * that does NOT match the one `getKey()` uses on the multipart upload path.
 *
 *   fileUploadRoutes.ts:241   `_uploadType !== 'publish' ? DRAFTS_FOLDER : ''`
 *   file-upload.ts:75-76      `ensureUploadTypeHeader(req) === 'draft' ? DRAFTS_FOLDER : ''`
 *
 * They agree for 'draft' and 'publish' and disagree for 'presigned'. A
 * refactor that "unifies" them would relocate every presigned upload between
 * `admin-drafts/…` and the bucket root and 404 all previously-uploaded
 * presigned media — while every function-level test stayed green. Hence these.
 *
 * The presigned POST is signed entirely locally from static credentials, so
 * these tests hit no network and need no S3 double. `fields.key` in the
 * response IS the S3 object key.
 */

const API_KEYS = {
  FILE_UPLOAD_KEY_DRAFT: 'test-draft-key',
  FILE_UPLOAD_KEY_PUBLISH: 'test-publish-key',
  FILE_UPLOAD_KEY_PRESIGNED: 'test-presigned-key',
}

const BASE_ENV: Record<string, string> = {
  ...API_KEYS,
  AWS_BUCKET_NAME: 'test-bucket',
  AWS_REGION_NAME: 'eu-west-1',
  API_SERVER: 'https://api.test',
  // Static credentials: the SDK's default chain reads these first, and
  // `createPresignedPost` never leaves the process.
  AWS_ACCESS_KEY_ID: 'AKIAIOSFODNN7EXAMPLE',
  AWS_SECRET_ACCESS_KEY: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
}

const ENV_KEYS = [
  ...Object.keys(BASE_ENV),
  'MEDIA_BUCKET_FOLDER',
  'AWS_PROFILE',
  'AWS_SESSION_TOKEN',
  'REDIS_URL',
  'OPENSEARCH_CLUSTER_ENDPOINT',
]

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

/** `constants.ts` and `misc.ts` both read env at module load, so the whole
 * graph has to be rebuilt for each env variation. */
const build = (env: Record<string, string> = BASE_ENV): FastifyInstance => {
  jest.resetModules()
  Object.entries(env).forEach(([key, value]) => {
    process.env[key] = value
  })
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { buildServer } = require('../app') as {
    buildServer: () => FastifyInstance
  }
  return buildServer()
}

/** Posts to /file-presigned and returns the S3 key the route generated. */
const presignedKeyFor = async (
  app: FastifyInstance,
  apiKey: string,
  scope: string,
  body: Record<string, string> = {
    fileName: 'barchart.png',
    hash: 'abcd1234',
  },
) => {
  const res = await app.inject({
    method: 'POST',
    url: `/api/v1/file-presigned?scope=${encodeURIComponent(scope)}`,
    headers: { 'x-apikey': apiKey, 'content-type': 'application/json' },
    payload: JSON.stringify(body),
  })
  return { statusCode: res.statusCode, res }
}

const keyOf = (res: { body: string }) => JSON.parse(res.body).fields.key

// ---------------------------------------------------------------------------

describe('POST /api/v1/file-presigned — rootFolder is decided by the ROUTE', () => {
  let app: FastifyInstance

  afterEach(async () => {
    if (app) {
      await app.close()
    }
  })

  it("puts 'draft' uploads under admin-drafts/", async () => {
    app = build()

    const { res, statusCode } = await presignedKeyFor(
      app,
      API_KEYS.FILE_UPLOAD_KEY_DRAFT,
      'foo',
    )

    expect(statusCode).toBe(200)
    expect(keyOf(res)).toBe('admin-drafts/files/foo/barchart--abcd1234.png')
  })

  it("puts 'publish' uploads at the bucket root", async () => {
    app = build()

    const { res, statusCode } = await presignedKeyFor(
      app,
      API_KEYS.FILE_UPLOAD_KEY_PUBLISH,
      'foo',
    )

    expect(statusCode).toBe(200)
    expect(keyOf(res)).toBe('files/foo/barchart--abcd1234.png')
  })

  it("puts 'presigned' uploads under admin-drafts/ — where getKey would NOT", async () => {
    // THE DIVERGENCE. The route's `!== 'publish'` ternary sends presigned
    // uploads to admin-drafts/. `getKey`'s `=== 'draft'` ternary would send
    // the identical upload to the bucket root. Both behaviours are live; this
    // is the one that governs presigned media already in the bucket.
    app = build()

    const { res, statusCode } = await presignedKeyFor(
      app,
      API_KEYS.FILE_UPLOAD_KEY_PRESIGNED,
      'foo',
    )

    expect(statusCode).toBe(200)
    expect(keyOf(res)).toBe('admin-drafts/files/foo/barchart--abcd1234.png')

    // And here is what the other code path would have produced for the very
    // same request. If a refactor makes these two equal, presigned media moves.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { getKey } = require('../utils/file-upload') as {
      getKey: (
        req: unknown,
        file: { originalname: string; $hash$?: string },
      ) => string
    }
    const viaGetKey = getKey(
      {
        query: { folder: 'foo' },
        headers: { 'x-apikey': API_KEYS.FILE_UPLOAD_KEY_PRESIGNED },
      },
      { originalname: 'barchart.png', $hash$: 'abcd1234' },
    )

    expect(viaGetKey).toBe('files/foo/barchart--abcd1234.png')
    expect(keyOf(res)).not.toBe(viaGetKey)
  })

  it('agrees with getKey for draft uploads', async () => {
    app = build()

    const { res } = await presignedKeyFor(
      app,
      API_KEYS.FILE_UPLOAD_KEY_DRAFT,
      'foo',
    )

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { getKey } = require('../utils/file-upload') as {
      getKey: (
        req: unknown,
        file: { originalname: string; $hash$?: string },
      ) => string
    }
    const viaGetKey = getKey(
      {
        query: { folder: 'foo' },
        headers: { 'x-apikey': API_KEYS.FILE_UPLOAD_KEY_DRAFT },
      },
      { originalname: 'barchart.png', $hash$: 'abcd1234' },
    )

    expect(keyOf(res)).toBe(viaGetKey)
    expect(viaGetKey).toBe('admin-drafts/files/foo/barchart--abcd1234.png')
  })

  it('agrees with getKey for publish uploads', async () => {
    app = build()

    const { res } = await presignedKeyFor(
      app,
      API_KEYS.FILE_UPLOAD_KEY_PUBLISH,
      'foo',
    )

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { getKey } = require('../utils/file-upload') as {
      getKey: (
        req: unknown,
        file: { originalname: string; $hash$?: string },
      ) => string
    }
    const viaGetKey = getKey(
      {
        query: { folder: 'foo' },
        headers: { 'x-apikey': API_KEYS.FILE_UPLOAD_KEY_PUBLISH },
      },
      { originalname: 'barchart.png', $hash$: 'abcd1234' },
    )

    expect(keyOf(res)).toBe(viaGetKey)
    expect(viaGetKey).toBe('files/foo/barchart--abcd1234.png')
  })
})

describe('POST /api/v1/file-presigned — the missing slugification step', () => {
  let app: FastifyInstance

  afterEach(async () => {
    if (app) {
      await app.close()
    }
  })

  it('cannot handle a RegName scope: the slash never survives ensureFileScopeToken', async () => {
    // `getKey` runs `ensureRegName` -> `nameToSlug` FIRST, so `0123/2021`
    // becomes the folder `0123-2021`. The presigned route calls
    // `ensureFileScopeToken(request.query.scope)` directly with no
    // slugification, and a slash fails that token regex — so the folder
    // segment collapses to the literal string "undefined".
    //
    // This is the divergence to preserve, and the reason presigned uploads
    // scoped by RegName all pile into one `undefined` folder.
    app = build()

    const { res, statusCode } = await presignedKeyFor(
      app,
      API_KEYS.FILE_UPLOAD_KEY_PRESIGNED,
      '0123/2021',
    )

    expect(statusCode).toBe(200)
    expect(keyOf(res)).toBe(
      'admin-drafts/files/undefined/barchart--abcd1234.png',
    )

    // getKey, given the same scope, slugifies it properly.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { getKey } = require('../utils/file-upload') as {
      getKey: (
        req: unknown,
        file: { originalname: string; $hash$?: string },
      ) => string
    }
    expect(
      getKey(
        {
          query: { scope: '0123/2021' },
          headers: { 'x-apikey': API_KEYS.FILE_UPLOAD_KEY_PRESIGNED },
        },
        { originalname: 'barchart.png', $hash$: 'abcd1234' },
      ),
    ).toBe('files/0123-2021/barchart--abcd1234.png')
  })

  it('accepts an already-slugified scope', async () => {
    app = build()

    const { res, statusCode } = await presignedKeyFor(
      app,
      API_KEYS.FILE_UPLOAD_KEY_PRESIGNED,
      '0123-2021',
    )

    expect(statusCode).toBe(200)
    expect(keyOf(res)).toBe(
      'admin-drafts/files/0123-2021/barchart--abcd1234.png',
    )
  })

  it('prefixes MEDIA_BUCKET_FOLDER when set', async () => {
    app = build({ ...BASE_ENV, MEDIA_BUCKET_FOLDER: 'dev' })

    const { res, statusCode } = await presignedKeyFor(
      app,
      API_KEYS.FILE_UPLOAD_KEY_PUBLISH,
      'foo',
    )

    expect(statusCode).toBe(200)
    expect(keyOf(res)).toBe('dev/files/foo/barchart--abcd1234.png')
  })

  it('normalizes a pasted blob name, but sets no isPasted transform', async () => {
    app = build()

    const { res, statusCode } = await presignedKeyFor(
      app,
      API_KEYS.FILE_UPLOAD_KEY_PUBLISH,
      'foo',
      { fileName: 'blobid12345.png', hash: 'cafebabe' },
    )

    expect(statusCode).toBe(200)
    // Same name normalization as getKey — but the presigned path has no file
    // object, so nothing ever triggers the PNG -> JPEG flatten.
    expect(keyOf(res)).toBe('files/foo/image--cafebabe.png')
  })
})

describe('POST /api/v1/file-presigned — guards', () => {
  let app: FastifyInstance

  afterEach(async () => {
    if (app) {
      await app.close()
    }
  })

  it('rejects a request with no X-APIKey with 403', async () => {
    app = build()

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/file-presigned?scope=foo',
      headers: { 'content-type': 'application/json' },
      payload: JSON.stringify({ fileName: 'a.png' }),
    })

    expect(res.statusCode).toBe(403)
  })

  it('rejects an unknown X-APIKey with 403', async () => {
    app = build()

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/file-presigned?scope=foo',
      headers: { 'x-apikey': 'not-a-key', 'content-type': 'application/json' },
      payload: JSON.stringify({ fileName: 'a.png' }),
    })

    expect(res.statusCode).toBe(403)
  })

  it('rejects a draft upload whose scope is not a valid file-scope token', async () => {
    app = build()

    const { statusCode } = await presignedKeyFor(
      app,
      API_KEYS.FILE_UPLOAD_KEY_DRAFT,
      '0123/2021',
    )

    // Only the 'draft' branch validates the scope in onRequest — which is why
    // the 'presigned' branch above sails through to an `undefined` folder.
    expect(statusCode).toBe(403)
  })

  it('500s when fileName is missing, via createPresigned returning null', async () => {
    // `_generateFileKey` returns undefined for an empty name and
    // `createPresigned` turns that into null (upload.ts:64). This is the route
    // half of the guard contract pinned in upload.test.ts.
    app = build()

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/file-presigned?scope=foo',
      headers: {
        'x-apikey': API_KEYS.FILE_UPLOAD_KEY_PUBLISH,
        'content-type': 'application/json',
      },
      payload: JSON.stringify({ hash: 'abcd1234' }),
    })

    expect(res.statusCode).toBe(500)
  })

  it('OPTIONS /api/v1/file-presigned needs no API key (CORS preflight)', async () => {
    app = build()

    const res = await app.inject({
      method: 'OPTIONS',
      url: '/api/v1/file-presigned',
    })

    expect(res.statusCode).toBe(200)
  })
})

describe('POST /api/v1/file-upload — onRequest guard', () => {
  // The success path needs a real multipart body and an S3 endpoint, so only
  // the guard is covered here. `getKey` — the part that decides the object key
  // on this route — is characterized directly in utils/file-upload.test.ts.
  let app: FastifyInstance

  afterEach(async () => {
    if (app) {
      await app.close()
    }
  })

  it('rejects a missing X-APIKey with 403', async () => {
    app = build()

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/file-upload?scope=foo',
    })

    expect(res.statusCode).toBe(403)
  })

  it('requires a RegName scope for publish uploads', async () => {
    app = build()

    expect(
      (
        await app.inject({
          method: 'POST',
          url: '/api/v1/file-upload?scope=foo',
          headers: { 'x-apikey': API_KEYS.FILE_UPLOAD_KEY_PUBLISH },
        })
      ).statusCode,
    ).toBe(403)

    // A well-formed RegName gets past onRequest and on into the multipart
    // preHandler, which rejects the non-multipart body with 415 or 406 rather
    // than 403 — enough to prove the guard itself passed.
    const ok = await app.inject({
      method: 'POST',
      url: '/api/v1/file-upload?scope=0123%2F2021',
      headers: { 'x-apikey': API_KEYS.FILE_UPLOAD_KEY_PUBLISH },
    })
    expect(ok.statusCode).not.toBe(403)
  })

  it('requires a file-scope token for draft uploads', async () => {
    app = build()

    expect(
      (
        await app.inject({
          method: 'POST',
          url: '/api/v1/file-upload?scope=0123%2F2021',
          headers: { 'x-apikey': API_KEYS.FILE_UPLOAD_KEY_DRAFT },
        })
      ).statusCode,
    ).toBe(403)

    const ok = await app.inject({
      method: 'POST',
      url: '/api/v1/file-upload?scope=foo',
      headers: { 'x-apikey': API_KEYS.FILE_UPLOAD_KEY_DRAFT },
    })
    expect(ok.statusCode).not.toBe(403)
  })
})
