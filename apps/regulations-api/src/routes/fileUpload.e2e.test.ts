import type { FastifyInstance } from 'fastify'

/**
 * END-TO-END characterization of `POST /api/v1/file-upload`.
 *
 * This is the HTTP contract, which is the thing that must survive both the
 * upload rewrite and the Fastify 5 bump: given a multipart body, which S3 key
 * do the bytes land under, and which URL comes back to the caller. Everything
 * else — multer storage objects, SDK clients, transform arrays — is mechanism
 * and is deliberately NOT asserted on.
 *
 * PROVENANCE OF THE EXPECTED VALUES. Every literal below was measured against
 * the pre-rewrite implementation (Fastify 4 + `multer-s3-transform` + aws-sdk
 * v2) at commit c937fbda:
 *   - the key composition (rootFolder / folder / name / hash / extension and
 *     the `.png` -> `.jpg` transform) by executing that build's `getKey` and
 *     `transforms[0].key` callbacks directly;
 *   - the `--f5d6d878` style hashes with the md5-of-latin1-string algorithm
 *     that build used (`file-upload.ts:163-167` there, unchanged at :153-157
 *     today, where a comment now records that it must not be "corrected").
 *
 * DO NOT CHANGE AN EXPECTED VALUE TO MAKE A TEST PASS. Each one is a live URL
 * for media already in the bucket; a diff here is a production 404, not a test
 * that needs updating.
 *
 * TWO KINDS OF TEST LIVE IN THIS FILE, and they carry different authority.
 * Each describe block below is labelled CHARACTERIZED or SPECIFIED.
 *
 *   CHARACTERIZED — the old implementation demonstrably behaved this way, so
 *   the value is historical contract and a change to it breaks live URLs.
 *   Covers: the raw upload's key and byte-identical body, the pasted blob's
 *   `.jpg` location, the literal `undefined` folder segment, RegName
 *   slugification, MEDIA_BUCKET_FOLDER prefixing, the original-bytes content
 *   type on a transformed object, and large-file acceptance.
 *
 *   SPECIFIED — the old implementation had no equivalent, so these state what
 *   the new code MUST do rather than what the old code did. Nobody should read
 *   them as historical contract. Covers 400 on a wrong field name and 400 on a
 *   non-multipart body, which are a deliberate behaviour CHANGE: the old
 *   handler's guard was dead code and returned 200 with a `location` ending in
 *   the literal string `undefined`.
 *
 * Content-type detection was SPECIFIED until the old sniffing stack could be
 * measured from the yarn cache; it is now CHARACTERIZED. See that block.
 *
 * The ONLY thing stubbed is the S3 network boundary — `@aws-sdk/lib-storage`'s
 * `Upload` — so the assertions can read the exact params the app tried to
 * send. Nothing belonging to this codebase is mocked.
 */

/**
 * Each test calls `build()`, which does `jest.resetModules()` and re-`require`s
 * `../app` so the server picks up that test's env. That makes a full
 * module-graph re-import the per-test cost -- ~430ms locally, but ~4s in CI
 * where 35 projects' jest workers share a 2-core runner. Against jest's 5s
 * default that leaves no margin: three tests here timed out on
 * https://github.com/DMR-is/dmr.is/actions/runs/32127099827 with no assertion
 * ever running, and the intrinsically slowest test in the file passed. The
 * budget is set to match what the suite actually costs rather than left to
 * chance.
 */
jest.setTimeout(30000)


type UploadParams = {
  Bucket: string
  Key: string
  ACL: string
  ContentType: string
  StorageClass: string
  Body: Buffer
}

const mockUploadCalls: Array<UploadParams> = []

jest.mock('@aws-sdk/lib-storage', () => ({
  Upload: class {
    params: UploadParams
    constructor(input: { params: UploadParams }) {
      this.params = input.params
      mockUploadCalls.push(input.params)
    }
    async done() {
      return { Key: this.params.Key }
    }
  },
}))

const BASE_ENV: Record<string, string> = {
  FILE_UPLOAD_KEY_DRAFT: 'test-draft-key',
  FILE_UPLOAD_KEY_PUBLISH: 'test-publish-key',
  FILE_UPLOAD_KEY_PRESIGNED: 'test-presigned-key',
  AWS_BUCKET_NAME: 'test-bucket',
  AWS_REGION_NAME: 'eu-west-1',
  API_SERVER: 'https://api.test',
  AWS_ACCESS_KEY_ID: 'AKIAIOSFODNN7EXAMPLE',
  AWS_SECRET_ACCESS_KEY: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
}

const ENV_KEYS = [
  ...Object.keys(BASE_ENV),
  'MEDIA_BUCKET_FOLDER',
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
  mockUploadCalls.length = 0
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

/**
 * A fixed 8x8 semi-transparent red PNG, inlined as base64 rather than
 * generated with sharp at run time. The file's bytes are an input to the
 * object key (its md5 becomes the `--xxxxxxxx` segment), so generating them
 * would make the expected hashes depend on the installed sharp/libvips
 * version. These bytes never change, so the expected hash never changes.
 */
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAACXBIWXMAAAPoAAAD6AG1e1Jr' +
    'AAAAEklEQVR4nGP4z8DQgA8zjAwFAJKHX8FJV0QtAAAAAElFTkSuQmCC',
  'base64',
)
// The md5-of-latin1 of those bytes is `f5d6d878`, which is why that string
// appears in the expected keys below. It is written out as a literal at each
// assertion rather than recomputed here — recomputing it in the test would
// mean a changed hash algorithm produced a changed key and the test still
// agreed with it.

/** Bare `<svg>` — the shape that kept working through the content-type
 * regression, because `file-type` does not recognise it. */
const SVG = Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg"><path fill="#00CD9F"/></svg>',
)

/** SVG with an XML declaration — what most editors emit, and the shape that
 * `file-type@16` reports as `application/xml`. */
const XML_DECL_SVG = Buffer.from(
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">' +
    '<path fill="#00CD9F" d="M0 0h16v16H0z"/></svg>',
)

/** SVG with both an XML declaration and a DOCTYPE — Illustrator/Inkscape. */
const DOCTYPE_SVG = Buffer.from(
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" ' +
    '"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n' +
    '<svg xmlns="http://www.w3.org/2000/svg"><path fill="#00CD9F"/></svg>',
)

/** XML that is not SVG — the other side of the guard. */
const PLAIN_XML = Buffer.from(
  '<?xml version="1.0"?><note><body>hello</body></note>',
)

/**
 * An SVG larger than one 64KB stream chunk — 76,068 bytes. Built by repetition
 * so the bytes, and therefore the `--20071098` hash, are deterministic.
 *
 * Size is the whole point: the old stack sniffed only the first chunk, so
 * anything past 65,536 bytes was invisible to it. Maps and technical diagrams
 * in a regulations corpus land here routinely.
 */
const LARGE_SVG = Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">' +
    '<path fill="#00CD9F" d="M0 0h1v1H0z"/>'.repeat(2000) +
    '</svg>',
)

const BOUNDARY = '----dmrisuploadboundary'

const multipartBody = (
  fieldname: string,
  filename: string,
  content: Buffer,
  contentType = 'image/png',
) =>
  Buffer.concat([
    Buffer.from(
      `--${BOUNDARY}\r\n` +
        `Content-Disposition: form-data; name="${fieldname}"; filename="${filename}"\r\n` +
        `Content-Type: ${contentType}\r\n\r\n`,
    ),
    content,
    Buffer.from(`\r\n--${BOUNDARY}--\r\n`),
  ])

const upload = (
  app: FastifyInstance,
  {
    filename,
    query = '?scope=foo&folder=foo',
    apiKey = BASE_ENV.FILE_UPLOAD_KEY_DRAFT,
    fieldname = 'file',
    content = PNG,
    contentType = 'image/png',
  }: {
    filename: string
    query?: string
    apiKey?: string
    fieldname?: string
    content?: Buffer
    contentType?: string
  },
) =>
  app.inject({
    method: 'POST',
    url: `/api/v1/file-upload${query}`,
    headers: {
      'x-apikey': apiKey,
      'content-type': `multipart/form-data; boundary=${BOUNDARY}`,
    },
    payload: multipartBody(fieldname, filename, content, contentType),
  })

const locationOf = (res: { body: string }) => JSON.parse(res.body).location

/** The params of the single S3 upload the request should have attempted.
 * Fails loudly rather than throwing a TypeError when nothing was uploaded. */
const uploaded = (): UploadParams => {
  const call = mockUploadCalls[0]
  if (!call) {
    throw new Error('expected an S3 upload to have been attempted, but none was')
  }
  return call
}

// ---------------------------------------------------------------------------

/** CHARACTERIZED from the pre-rewrite implementation at c937fbda. */
describe('POST /api/v1/file-upload — an ordinary file', () => {
  let app: FastifyInstance

  afterEach(async () => {
    if (app) {
      await app.close()
    }
  })

  it('stores the bytes untouched under the getKey key and returns it as location', async () => {
    app = build()

    const res = await upload(app, { filename: 'barchart.png' })

    expect(res.statusCode).toBe(200)
    expect(locationOf(res)).toBe(
      'https://files.reglugerd.is/admin-drafts/files/foo/barchart--f5d6d878.png',
    )

    expect(mockUploadCalls).toHaveLength(1)
    expect(uploaded().Bucket).toBe('test-bucket')
    expect(uploaded().Key).toBe(
      'admin-drafts/files/foo/barchart--f5d6d878.png',
    )
    expect(uploaded().ACL).toBe('private')
    expect(uploaded().StorageClass).toBe('STANDARD')
    expect(uploaded().ContentType).toBe('image/png')

    // Byte-for-byte — no transform ran.
    expect(Buffer.compare(uploaded().Body, PNG)).toBe(0)
  })

  it('returns exactly the key the bytes were stored under', async () => {
    // The location and the S3 key are two separate expressions in the route.
    // Assert they agree, so returning the untransformed key (the bug this
    // whole file exists to catch) fails here too.
    app = build()

    const res = await upload(app, { filename: 'barchart.png' })

    expect(locationOf(res)).toBe(
      'https://files.reglugerd.is/' + uploaded().Key,
    )
  })
})

/** CHARACTERIZED from the pre-rewrite implementation at c937fbda. */
describe('POST /api/v1/file-upload — a pasted blob', () => {
  let app: FastifyInstance

  afterEach(async () => {
    if (app) {
      await app.close()
    }
  })

  it('stores it as JPEG under the .jpg key, NOT the .png key getKey names', async () => {
    // THE CENTRAL CASE. `getKey()` names this upload
    // `admin-drafts/files/foo/image--f5d6d878.png`; the object that actually
    // exists is the `.jpg`. Both are written out so the relationship is
    // explicit and a regression cannot be read as a cosmetic diff.
    app = build()

    const res = await upload(app, { filename: 'blobid12345.png' })

    expect(res.statusCode).toBe(200)
    expect(locationOf(res)).toBe(
      'https://files.reglugerd.is/admin-drafts/files/foo/image--f5d6d878.jpg',
    )
    expect(locationOf(res)).not.toBe(
      'https://files.reglugerd.is/admin-drafts/files/foo/image--f5d6d878.png',
    )

    expect(uploaded().Key).toBe(
      'admin-drafts/files/foo/image--f5d6d878.jpg',
    )
  })

  it('the hash survives the extension rewrite unchanged', async () => {
    // The md5 is of the ORIGINAL png bytes, not the flattened jpeg — so the
    // same `--f5d6d878` appears on a `.jpg` key. Recomputing the hash from the
    // transformed bytes would change every pasted image's URL.
    app = build()

    await upload(app, { filename: 'blobid12345.png' })

    expect(uploaded().Key).toContain('--f5d6d878')
    expect(uploaded().Key.endsWith('.jpg')).toBe(true)
  })

  it('the stored body really is JPEG, and is not the original PNG', async () => {
    app = build()

    await upload(app, { filename: 'blobid12345.png' })

    const body = uploaded().Body
    // JPEG SOI marker.
    expect(body.subarray(0, 2)).toEqual(Buffer.from([0xff, 0xd8]))
    expect(Buffer.compare(body, PNG)).not.toBe(0)
  })

  it('keeps the ORIGINAL content type on the transformed object', async () => {
    // Preserved quirk: content type is sniffed from the original bytes, so
    // every pasted image in the bucket is a JPEG served as image/png. Pinned
    // because it is pre-existing, not because it is right.
    app = build()

    await upload(app, { filename: 'blobid12345.png' })

    expect(uploaded().ContentType).toBe('image/png')
  })
})

/** CHARACTERIZED from the pre-rewrite implementation at c937fbda. */
describe('POST /api/v1/file-upload — isPasted is the only gate on the transform', () => {
  let app: FastifyInstance

  afterEach(async () => {
    if (app) {
      await app.close()
    }
  })

  it('an ordinary .png is NOT flattened, though the key rewrite would apply to it', async () => {
    // Identical bytes and extension to the pasted case above; only the
    // filename differs. That is the whole gate.
    app = build()

    const res = await upload(app, { filename: 'barchart.png' })

    expect(locationOf(res)).toBe(
      'https://files.reglugerd.is/admin-drafts/files/foo/barchart--f5d6d878.png',
    )
    expect(uploaded().Key.endsWith('.png')).toBe(true)
    expect(Buffer.compare(uploaded().Body, PNG)).toBe(0)
  })

  it('an explicit "pasted--" prefix triggers the transform just like blobidNNN', async () => {
    app = build()

    const res = await upload(app, { filename: 'pasted--image.png' })

    expect(locationOf(res)).toBe(
      'https://files.reglugerd.is/admin-drafts/files/foo/image--f5d6d878.jpg',
    )
  })

  it('a blobid name with a non-png extension is left alone', async () => {
    app = build()

    const res = await upload(app, { filename: 'blobid12345.jpg' })

    expect(locationOf(res)).toBe(
      'https://files.reglugerd.is/admin-drafts/files/foo/blobid12345--f5d6d878.jpg',
    )
    // Untransformed: the bytes are still the original PNG.
    expect(Buffer.compare(uploaded().Body, PNG)).toBe(0)
  })
})

/** CHARACTERIZED from the pre-rewrite implementation at c937fbda. */
describe('POST /api/v1/file-upload — folder and rootFolder in the returned URL', () => {
  let app: FastifyInstance

  afterEach(async () => {
    if (app) {
      await app.close()
    }
  })

  it('round-trips the literal "undefined" folder segment', async () => {
    // `?scope=foo` is a valid file-scope token, so onRequest lets a draft
    // upload through, but it is not a RegName, so getKey derives no folder.
    // Media really is sitting under `files/undefined/` in production.
    app = build()

    const res = await upload(app, { filename: 'barchart.png', query: '?scope=foo' })

    expect(locationOf(res)).toBe(
      'https://files.reglugerd.is/admin-drafts/files/undefined/barchart--f5d6d878.png',
    )
  })

  it('slugifies a RegName scope on a publish upload, and uses no root folder', async () => {
    app = build()

    const res = await upload(app, {
      filename: 'barchart.png',
      query: '?scope=0123%2F2021',
      apiKey: BASE_ENV.FILE_UPLOAD_KEY_PUBLISH,
    })

    expect(locationOf(res)).toBe(
      'https://files.reglugerd.is/files/0123-2021/barchart--f5d6d878.png',
    )
  })

  it('prefixes MEDIA_BUCKET_FOLDER when set', async () => {
    app = build({ ...BASE_ENV, MEDIA_BUCKET_FOLDER: 'dev' })

    const res = await upload(app, { filename: 'barchart.png' })

    expect(locationOf(res)).toBe(
      'https://files.reglugerd.is/dev/admin-drafts/files/foo/barchart--f5d6d878.png',
    )
  })
})

/** SPECIFIED (the two 400s) and CHARACTERIZED (the large upload) — see the
 * per-test comments; this block deliberately mixes the two. */
describe('POST /api/v1/file-upload — rejections and limits', () => {
  let app: FastifyInstance

  afterEach(async () => {
    if (app) {
      await app.close()
    }
  })

  it('400s when the multipart field is not named "file", and uploads nothing', async () => {
    app = build()

    const res = await upload(app, {
      filename: 'barchart.png',
      fieldname: 'notfile',
    })

    expect(res.statusCode).toBe(400)
    expect(JSON.parse(res.body)).toEqual({ error: 'No file was uploaded' })
    expect(mockUploadCalls).toHaveLength(0)
  })

  it('400s on a non-multipart body, and uploads nothing', async () => {
    app = build()

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/file-upload?scope=foo',
      headers: { 'x-apikey': BASE_ENV.FILE_UPLOAD_KEY_DRAFT },
    })

    expect(res.statusCode).toBe(400)
    expect(JSON.parse(res.body)).toEqual({ error: 'No file was uploaded' })
    expect(mockUploadCalls).toHaveLength(0)
  })

  it('accepts a file well over Fastify’s 1MB bodyLimit', async () => {
    // CHARACTERIZED, and the direction matters: the pre-rewrite path accepted
    // large uploads, so SUCCESS is the contract. Asserting a rejection here
    // would have pinned a regression.
    //
    // Measured rather than assumed, because fastify-multer is uninstalled and
    // the old path can no longer be driven directly:
    //   1. fastify-multer 2.0.3 (the version at c937fbda, read from the yarn
    //      cache) registers `addContentTypeParser('multipart', (req, payload,
    //      done) => done(null))` — a STREAM-form parser that never buffers.
    //   2. Fastify 4's `bodyLimit` does not apply to stream-form parsers.
    //      Verified empirically on fastify 4.29.1 with a parser of that exact
    //      shape: 0.5MB, 3MB and 12MB all reached the handler intact.
    //   3. The old code called `multer({ storage })` with no `limits` key, and
    //      busboy's default `fileSize` is Infinity.
    // So the old path had no size limit at all.
    //
    // `@fastify/multipart` instead defaults `fileSize` to `bodyLimit`, so the
    // explicit `limits: { fileSize: Infinity }` in file-upload.ts is what
    // preserves this. Removing it makes exactly this test fail with 413 —
    // checked, not assumed. Government regulation scans routinely exceed 1MB.
    app = build()

    const big = Buffer.alloc(3 * 1024 * 1024, 7)
    const res = await upload(app, {
      filename: 'big.bin',
      content: big,
      contentType: 'application/octet-stream',
    })

    expect(res.statusCode).toBe(200)
    expect(locationOf(res)).toBe(
      'https://files.reglugerd.is/admin-drafts/files/foo/big--1dc97192.bin',
    )
    expect(Buffer.compare(uploaded().Body, big)).toBe(0)
  })

  it('403s before reading the body when the API key is missing', async () => {
    app = build()

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/file-upload?scope=foo',
      headers: { 'content-type': `multipart/form-data; boundary=${BOUNDARY}` },
      payload: multipartBody('file', 'barchart.png', PNG),
    })

    expect(res.statusCode).toBe(403)
    expect(mockUploadCalls).toHaveLength(0)
  })
})

/**
 * CHARACTERIZED. Upgraded from SPECIFIED once the old stack could be measured
 * directly: `file-type@3.9.0` and `is-svg@2.1.0` — the exact versions
 * `multer-s3-transform` bundled — were extracted from the yarn cache and run
 * through AUTO_CONTENT_TYPE's algorithm verbatim (`fileType(chunk)`, else
 * `isSvg(chunk)`, else `application/octet-stream`). Measured results:
 *
 *   input                          OLD                       NEW without guard
 *   svg, bare <svg>                image/svg+xml             image/svg+xml
 *   svg, <?xml?> declaration       image/svg+xml             application/xml   <-- REGRESSION
 *   svg, <?xml?> + <!DOCTYPE>      image/svg+xml             application/xml   <-- REGRESSION
 *   png                            image/png                 image/png
 *   non-svg xml                    application/octet-stream  application/xml   <-- REGRESSION
 *   plain text                     application/octet-stream  application/octet-stream
 *
 * `file-type@16` detects XML where `file-type@3` detected no text formats at
 * all, so it returns before the `isSvg` fallback ever runs. Every SVG carrying
 * an `<?xml …?>` declaration — i.e. anything Illustrator or Inkscape exports —
 * would be stored as `application/xml` and refuse to render in an `<img>`.
 * Bare `<svg>` files keep working, which is what makes it look intermittent.
 *
 * These tests fail against the unguarded implementation and pass with the
 * guard, which is the only thing that makes them worth having.
 *
 * ONE test in this block is SPECIFIED rather than characterized — the >64KB
 * SVG — and says so in its own comment. It asserts a deliberate improvement on
 * the old behaviour, not a match to it.
 */
describe('POST /api/v1/file-upload — content type detection', () => {
  let app: FastifyInstance

  afterEach(async () => {
    if (app) {
      await app.close()
    }
  })

  it('sniffs a bare <svg> file', async () => {
    // CONTROL, not load-bearing: this shape passes with or WITHOUT the xml
    // guard, because `file-type@16` returns undefined for a bare `<svg…>` and
    // the request reaches `isSvg` either way. It is here so the cases below
    // read as a contrast rather than a lone failure. If the SVG coverage ever
    // gets trimmed, trim THIS one — the `<?xml?>` and `<!DOCTYPE>` cases are
    // the ones that actually prove the guard does something.
    app = build()

    const res = await upload(app, {
      filename: 'logo.svg',
      content: SVG,
      contentType: 'image/svg+xml',
    })

    expect(res.statusCode).toBe(200)
    expect(uploaded().ContentType).toBe('image/svg+xml')
    expect(locationOf(res)).toBe(
      'https://files.reglugerd.is/admin-drafts/files/foo/logo--cc9a9756.svg',
    )
  })

  it('sniffs an SVG carrying an <?xml?> declaration as image/svg+xml', async () => {
    // THE REGRESSION CASE. Stored as application/xml without the guard.
    app = build()

    const res = await upload(app, {
      filename: 'logo.svg',
      content: XML_DECL_SVG,
      contentType: 'image/svg+xml',
    })

    expect(res.statusCode).toBe(200)
    expect(uploaded().ContentType).toBe('image/svg+xml')
    expect(uploaded().ContentType).not.toBe('application/xml')
    expect(locationOf(res)).toBe(
      'https://files.reglugerd.is/admin-drafts/files/foo/logo--4df6e1b8.svg',
    )
  })

  it('sniffs an SVG with an <?xml?> declaration AND a <!DOCTYPE> as image/svg+xml', async () => {
    // What Illustrator and Inkscape actually emit.
    app = build()

    const res = await upload(app, {
      filename: 'diagram.svg',
      content: DOCTYPE_SVG,
      contentType: 'image/svg+xml',
    })

    expect(res.statusCode).toBe(200)
    expect(uploaded().ContentType).toBe('image/svg+xml')
    expect(uploaded().ContentType).not.toBe('application/xml')
    expect(locationOf(res)).toBe(
      'https://files.reglugerd.is/admin-drafts/files/foo/diagram--8dfa5fd5.svg',
    )
  })

  it('stores non-SVG XML as application/octet-stream, as the old stack did', async () => {
    // The other half of the guard. `file-type@3` recognised no text formats,
    // so XML that is not SVG fell through to the generic type. Pinned so a
    // future "improvement" that returns `application/xml` here is a visible
    // decision rather than a silent drift.
    app = build()

    const res = await upload(app, {
      filename: 'metadata.xml',
      content: PLAIN_XML,
      contentType: 'application/xml',
    })

    expect(res.statusCode).toBe(200)
    expect(uploaded().ContentType).toBe('application/octet-stream')
    expect(locationOf(res)).toBe(
      'https://files.reglugerd.is/admin-drafts/files/foo/metadata--1fa4dc10.xml',
    )
  })

  it('SPECIFIED: an SVG over 64KB is image/svg+xml — a deliberate IMPROVEMENT on the old behaviour', async () => {
    // NOT characterization. The old stack returned `application/octet-stream`
    // here; this test asserts the new, BETTER answer, and does so on purpose.
    //
    // Measured, old stack vs new, on this exact 76,068-byte buffer:
    //   OLD (is-svg 2.1.0 on the first 65,536 bytes) = application/octet-stream
    //   NEW (is-svg 4.4.0 on the whole buffer)       = image/svg+xml
    //
    // `AUTO_CONTENT_TYPE` sniffed `file.stream.once('data')` — one chunk, 64KB
    // by default — so a larger SVG was judged on a truncated fragment with no
    // closing `</svg>`, `isSvg` said no, and it was stored as a download that
    // will not render in an `<img>`. The rewrite buffers the whole file because
    // it must (the MD5 is part of the object key) and therefore sniffs all of
    // it. The improvement falls out of that; it is not caused by the xml guard.
    //
    // This is NOT preservable — restoring it would mean deliberately truncating
    // the sniff to reproduce a bug. Verified that the divergence is truncation
    // and not the library version: is-svg 2.1.0 and 4.4.0 BOTH return false on
    // the truncated prefix and true on the whole buffer.
    //
    // The reason to spend a test on a fix: without it, someone diffing against
    // the old implementation sees a mismatch, calls it a regression, and
    // characterizes the truncated behaviour back in.
    app = build()

    const res = await upload(app, {
      filename: 'map.svg',
      content: LARGE_SVG,
      contentType: 'image/svg+xml',
    })

    expect(res.statusCode).toBe(200)
    expect(LARGE_SVG.length).toBeGreaterThan(65536) // guards the premise
    expect(uploaded().ContentType).toBe('image/svg+xml')
    expect(uploaded().ContentType).not.toBe('application/octet-stream')
    expect(locationOf(res)).toBe(
      'https://files.reglugerd.is/admin-drafts/files/foo/map--20071098.svg',
    )
  })

  it('stores an ordinary PNG as image/png', async () => {
    app = build()

    await upload(app, { filename: 'barchart.png' })

    expect(uploaded().ContentType).toBe('image/png')
  })

  it('stores the pasted JPEG object as image/png — a pre-existing quirk', async () => {
    // The type is sniffed from the ORIGINAL bytes, so the flattened JPEG is
    // stored describing itself as PNG. This is wrong, and it is what every
    // pasted image already in the bucket looks like, so it is pinned as
    // characterization. Fixing it is a separate deliberate change, not
    // something to correct quietly here.
    app = build()

    await upload(app, { filename: 'blobid12345.png' })

    expect(uploaded().Key.endsWith('.jpg')).toBe(true)
    expect(uploaded().ContentType).toBe('image/png')
  })

  it('ignores the multipart part’s declared content type and sniffs the bytes', async () => {
    // A client lying about the type does not change what S3 is told.
    app = build()

    await upload(app, {
      filename: 'barchart.png',
      contentType: 'text/plain',
    })

    expect(uploaded().ContentType).toBe('image/png')
  })
})
