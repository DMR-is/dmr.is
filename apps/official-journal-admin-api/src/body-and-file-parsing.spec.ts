/**
 * Characterization tests for multipart file upload and for the explicit
 * body-parser configuration of official-journal-admin-api.
 *
 * WHY THIS EXISTS
 * Nest 11 ships `@nestjs/platform-express` with Express 5, which depends on
 * `body-parser` 2.x. Two changes there are invisible to the type checker:
 *
 *   1. `body-parser` 1.20 does `req.body = req.body || {}` before it decides
 *      whether there is anything to parse (lib/types/json.js:112). `body-parser`
 *      2.3 replaced that with `if (!('body' in req)) req.body = undefined`
 *      (lib/read.js:45-48). So a request that carries no body leaves
 *      `req.body === {}` today and `req.body === undefined` afterwards. Anything
 *      downstream that does `Object.keys(body)` or spreads `...body` changes
 *      behaviour with no compile error.
 *   2. `body-parser` 1.x short-circuits an already-parsed request with the
 *      `req._body` flag; 2.x dropped `_body` for
 *      `onFinished.isFinished(req)`. Nothing in this repo reads `_body`
 *      directly, but it is the reason a second parser is harmless today, and
 *      directorate-of-equality-api stacks `raw()` in front of `json()`.
 *
 * `express.urlencoded`'s `extended` default also flips in Express 5, but
 * `main.ts:30` passes it explicitly, so those tests are here to record the
 * nested-body behaviour rather than to guard a default.
 *
 * LABELS
 *   CHARACTERIZED    -- measured and unchanged across the bump. These held on
 *                       Express 4.22.2 / body-parser 1.20.6 / Nest 10.4 and
 *                       still hold on Express 5.2.1 / body-parser 2.3.0 /
 *                       Nest 11.1.29. multer stayed on 2.2.0 throughout.
 *   NEST 11 BASELINE -- moved on the bump. The superseded Nest 10 value is named
 *                       in each comment.
 *   SPECIFIED        -- a decision. Changing it needs a new decision.
 *
 * THE SIMULATION WAS ACCURATE, WITH ONE MISS
 * The prediction below named exactly the three body-parser SKIP-path tests that
 * reddened. Two further tests moved that it did not anticipate, because neither
 * is about body-parser:
 *   - the multer "Unexpected field" message, which
 *     `@nestjs/platform-express@11` now suffixes with ` - <field>`
 *   - the parser-dedup probe, because Express 5 renamed `app._router` to
 *     `app.router`
 * The dedup itself survived, as predicted.
 *
 * THE FUTURE WAS SIMULATED, NOT GUESSED -- AND THE TECHNIQUE NO LONGER WORKS
 * `express.json` is a direct re-export of `body-parser.json`
 * (express/lib/express.js:78-83), and Nest 10's parser registration did
 * `require('body-parser')` too. So swapping that single module swapped the
 * entire parsing layer -- ours and Nest's. This file was run with
 *   jest.mock('body-parser', () => require('<path to a real body-parser@2.3.0>'))
 * prepended, against Nest 10 and Express 4 otherwise untouched.
 *
 * Do NOT reuse that recipe on Nest 11. `@nestjs/platform-express@11` no longer
 * declares or requires body-parser at all -- `registerParserMiddleware`
 * (express-adapter.js:188-195) calls `express.json()` / `express.urlencoded()`.
 * And a bare `jest.mock('body-parser')` now resolves the HOISTED copy, which is
 * still 1.20.6 because Nx build tooling depends on Express 4, while the parser
 * actually in use is express's nested 2.3.0. The mock would bind to the wrong
 * module and quietly prove nothing.
 *
 * Exactly three tests reddened under the simulation, all body-parser SKIP-path
 * cases:
 *   - "no body at all -> {} not undefined"
 *   - "multipart sent to a JSON endpoint -> the body is {}"
 *   - "a JSON body under content-type: text/plain -> body stays {}"
 * Everything else -- the 8mb limit, the 413 envelope, the parser dedup, the
 * zero-length JSON special case, every multipart assertion -- was unaffected.
 * Note that the version canary below reads `body-parser/package.json` and so
 * stays green under that mock; it only fires on a real dependency change.
 *
 * WHAT IS MIRRORED FROM PRODUCTION
 *   - `app.use(json({ limit: '8mb' }))` and
 *     `app.use(urlencoded({ extended: true, limit: '8mb' }))`, registered
 *     BEFORE `app.init()`, exactly as `main.ts:29-30` does.
 *   - `ExceptionFactoryPipe()` as the global pipe (`main.ts:32`).
 *   - `FileInterceptor('file')` with no options, plus the `ParseFilePipe`
 *     validator stack of `case.controller.ts:682-699` -- `MaxFileSizeValidator`
 *     at 20MB and `FileTypeValidationPipe` with `ALLOWED_PDF_MIME_TYPES` and
 *     `maxNumberOfFiles: 1`.
 * A test that used different interceptor options would measure something else,
 * so the options are copied rather than simplified.
 *
 * WHY A THROWAWAY CONTROLLER
 * The real endpoints sit behind `TokenJwtAuthGuard` + `RoleGuard`, which reject
 * before any interceptor runs -- see the "guard runs before the body is read"
 * block at the bottom of this file, which proves it. Driving the real
 * controller would therefore characterize the guard, not the parser. Every test
 * here asserts on the PARSED PAYLOAD, never on a status code alone, so a
 * request that never reached the parser cannot pass.
 */
import { IsString } from 'class-validator'
import { json, urlencoded } from 'express'
import { readFileSync } from 'node:fs'
import { connect } from 'node:net'
import request from 'supertest'

import type { INestApplication } from '@nestjs/common'
import {
  Body,
  Controller,
  MaxFileSizeValidator,
  ParseFilePipe,
  Post,
  UploadedFile,
  UseGuards,
} from '@nestjs/common'
import { UseInterceptors } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { Test } from '@nestjs/testing'

import { ALLOWED_PDF_MIME_TYPES, ONE_MEGA_BYTE } from '@dmr.is/constants'
import { LOGGER_PROVIDER } from '@dmr.is/logging'
import {
  ExceptionFactoryPipe,
  FileTypeValidationPipe,
} from '@dmr.is/pipelines'
import { TokenJwtAuthGuard } from '@dmr.is/shared-modules'

class ProbeJsonDto {
  @IsString()
  name!: string
}

/**
 * Read an installed dependency's version off disk. `require.resolve` rather than
 * a JSON import because `resolveJsonModule` is not enabled in this workspace,
 * and rather than `require()` because that trips
 * `@typescript-eslint/no-var-requires`.
 */
const packageVersion = (name: string, from?: string): string => {
  const contents = readFileSync(
    require.resolve(
      `${name}/package.json`,
      from ? { paths: [require.resolve(`${from}/package.json`)] } : undefined,
    ),
    'utf8',
  )

  return (JSON.parse(contents) as { version: string }).version
}

/** Serialisable view of a multer file, so assertions can name every field. */
const describeFile = (file: Express.Multer.File) => ({
  fieldname: file.fieldname,
  originalname: file.originalname,
  mimetype: file.mimetype,
  encoding: file.encoding,
  size: file.size,
  bufferIsBuffer: Buffer.isBuffer(file.buffer),
  bufferLength: file.buffer?.length,
  bufferUtf8: file.buffer?.toString('utf8'),
})

/** Set by the guarded probe below; see the credentials block. */
let guardedHandlerRan = false

@Controller('probe')
class ProbeController {
  @Post('single-file')
  @UseInterceptors(FileInterceptor('file'))
  singleFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({
            maxSize: ONE_MEGA_BYTE * 20,
            message: `File size exceeds the limit of 20MB.`,
          }),
          new FileTypeValidationPipe({
            mimetype: ALLOWED_PDF_MIME_TYPES,
            maxNumberOfFiles: 1,
          }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return { file: describeFile(file) }
  }

  @Post('json')
  json(@Body() body: unknown) {
    return {
      typeofBody: typeof body,
      isUndefined: body === undefined,
      isNull: body === null,
      keys:
        body !== null && typeof body === 'object' ? Object.keys(body) : null,
      body: body ?? null,
    }
  }

  @Post('json-dto')
  jsonDto(@Body() body: ProbeJsonDto) {
    return { name: body.name }
  }

  @Post('urlencoded')
  urlencodedBody(@Body() body: unknown) {
    return { body: body ?? null, keys: body ? Object.keys(body) : null }
  }
}

@Controller('guarded')
@UseGuards(TokenJwtAuthGuard)
class GuardedProbeController {
  @Post('single-file')
  @UseInterceptors(FileInterceptor('file'))
  singleFile(@UploadedFile() file?: Express.Multer.File) {
    guardedHandlerRan = true
    return { file: file ? describeFile(file) : null }
  }
}

const PDF_BYTES = Buffer.from('%PDF-1.7\nthis is not really a pdf\n%%EOF\n')

/**
 * Send a hand-written request over a socket. Needed for two things supertest
 * cannot express: a request with NO `content-length` header (a Node HTTP client
 * always emits `content-length: 0` for a bodyless POST) and a request with no
 * `content-type` at all (superagent's `.send(string)` quietly sets
 * `application/x-www-form-urlencoded`). Both distinctions decide which
 * body-parser branch runs, so they cannot be approximated.
 */
const rawRequest = (
  port: number,
  headerLines: Array<string>,
): Promise<string> =>
  new Promise((resolve, reject) => {
    let received = ''
    const socket = connect(port, '127.0.0.1', () => {
      socket.write(
        `${[...headerLines, 'Connection: close'].join('\r\n')}\r\n\r\n`,
      )
    })
    socket.setEncoding('utf8')
    socket.on('data', (chunk: string) => {
      received += chunk
    })
    socket.on('end', () => resolve(received))
    socket.on('error', reject)
  })

describe('body + multipart parsing (official-journal-admin-api, Express 5)', () => {
  let app: INestApplication
  let port: number

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ProbeController, GuardedProbeController],
      providers: [
        {
          provide: LOGGER_PROVIDER,
          useValue: {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
          },
        },
      ],
    }).compile()

    app = moduleRef.createNestApplication()
    // Same order as main.ts: the 8mb parsers go on before init(), which is
    // where Nest registers its own 100kb-default parsers.
    app.use(json({ limit: '8mb' }))
    app.use(urlencoded({ extended: true, limit: '8mb' }))
    app.useGlobalPipes(ExceptionFactoryPipe())
    // Listening on an ephemeral port so the raw-socket cases below have
    // somewhere to connect; supertest reuses the same listener.
    await app.listen(0)
    const address = app.getHttpServer().address()
    port = typeof address === 'object' && address ? address.port : 0
  })

  afterAll(async () => {
    await app.close()
  })

  const post = (url: string) => request(app.getHttpServer()).post(url)

  describe('the environment under test', () => {
    it('NEST 11 BASELINE: Express 5 and body-parser 2.x are what these numbers were measured on', () => {
      // Canary for the whole file, the body-side twin of the `query parser`
      // canary in query-string-parsing.spec.ts. Was Express 4.x / body-parser
      // 1.x.
      expect(packageVersion('express')).toMatch(/^5\./)

      // body-parser MUST be resolved through express, not from here. Nx dev
      // tooling (@nx/react, @nx/module-federation, webpack-dev-server) still
      // depends on express 4, so the HOISTED body-parser is 1.20.6 while the
      // copy that actually parses request bodies is express's own nested 2.x.
      // Probing the hoisted one would make this canary quietly lie.
      expect(packageVersion('body-parser', 'express')).toMatch(/^2\./)
    })

    it('CHARACTERIZED: multer is already on 2.x, so the multer major bump is NOT part of the Nest 11 risk', () => {
      expect(packageVersion('multer')).toMatch(/^2\./)
    })

    it('CHARACTERIZED: exactly ONE jsonParser is in the stack -- Nest skipped its own 100kb default', () => {
      // This is the actual mechanism behind the 8mb limit, and it is more
      // brittle than it looks. `ExpressAdapter.registerParserMiddleware`
      // (express-adapter.js:188-195) builds `{ jsonParser, urlencodedParser }`
      // and drops any key that `isMiddlewareApplied` already finds in the stack,
      // matching on `layer.handle.name`. body-parser names its returned
      // functions `jsonParser` / `urlencodedParser`, so main.ts's 8mb parsers do
      // not merely run first -- they stop Nest registering its 100kb defaults
      // at all.
      //
      // MEASURED on the bump: body-parser 2.3.0 keeps those function names, so
      // the dedup survived and both counts below are unchanged from Nest 10. If
      // it ever stopped matching, both parsers would be in the stack and these
      // counts would be 2.
      //
      // Express 5 renamed `app._router` to `app.router`. Nest 11's
      // `isMiddlewareApplied` reads `app.router`, which is why the dedup still
      // finds the stack; this test had to follow the same rename.
      const instance = app.getHttpAdapter().getInstance()
      const names = instance.router.stack.map(
        (layer: { name: string }) => layer.name,
      )

      expect(names.filter((n: string) => n === 'jsonParser')).toHaveLength(1)
      expect(names.filter((n: string) => n === 'urlencodedParser')).toHaveLength(
        1,
      )
    })
  })

  describe('1. successful multipart upload -- FileInterceptor(\'file\')', () => {
    it('CHARACTERIZED: filename, mimetype, size, encoding and buffer all arrive intact', async () => {
      const res = await post('/probe/single-file')
        .attach('file', PDF_BYTES, {
          filename: 'skjal.pdf',
          contentType: 'application/pdf',
        })
        .expect(201)

      expect(res.body.file).toEqual({
        fieldname: 'file',
        originalname: 'skjal.pdf',
        mimetype: 'application/pdf',
        encoding: '7bit',
        size: PDF_BYTES.length,
        bufferIsBuffer: true,
        bufferLength: PDF_BYTES.length,
        bufferUtf8: PDF_BYTES.toString('utf8'),
      })
      // The byte count is not just "some number": it is the exact payload.
      expect(res.body.file.size).toBe(40)
    })

    it('CHARACTERIZED: multer buffers into memory -- there is no disk storage and no multer-level size limit', async () => {
      // `FileInterceptor('file')` is called with no options, so multer uses
      // MemoryStorage with `limits` unset. A 10MB upload is fully buffered in
      // process memory BEFORE MaxFileSizeValidator ever sees it; the 20MB cap
      // is a post-hoc check, not backpressure. Recorded so the bump does not
      // get blamed for it later.
      const tenMegabytes = Buffer.alloc(ONE_MEGA_BYTE * 10, 0x41)

      const res = await post('/probe/single-file')
        .attach('file', tenMegabytes, {
          filename: 'big.pdf',
          contentType: 'application/pdf',
        })
        .expect(201)

      expect(res.body.file.size).toBe(ONE_MEGA_BYTE * 10)
      expect(res.body.file.bufferLength).toBe(ONE_MEGA_BYTE * 10)
    })

    it('NEST 11 BASELINE: a field name other than `file` is a 400 that now NAMES the offending field', async () => {
      const res = await post('/probe/single-file')
        .attach('skjal', PDF_BYTES, {
          filename: 'skjal.pdf',
          contentType: 'application/pdf',
        })
        .expect(400)

      // This is a MulterError (LIMIT_UNEXPECTED_FILE), not a Nest validation
      // error, and it reaches the client through Nest's external-exception
      // handler rather than through ExceptionFactoryPipe.
      //
      // Was the bare 'Unexpected field' on Nest 10. multer is unchanged at 2.2.0
      // and still sets `message = 'Unexpected field'` with the field name on a
      // separate `field` property -- it is `@nestjs/platform-express@11`'s
      // `transformException` (multer/multer/multer.utils.js:23-24) that now
      // appends ` - ${error.field}`.
      //
      // A client-visible 400 message changed shape. The appended value is the
      // field name the CLIENT sent, so nothing about the server leaks; but any
      // consumer matching on this string exactly will stop matching.
      expect(res.body.file).toBeUndefined()
      expect(res.body.message).toBe('Unexpected field - skjal')
    })

    it('CHARACTERIZED: a 20MB+ file is rejected by MaxFileSizeValidator with 400 and the configured message', async () => {
      const overLimit = Buffer.alloc(ONE_MEGA_BYTE * 20 + 1, 0x41)

      const res = await post('/probe/single-file')
        .attach('file', overLimit, {
          filename: 'huge.pdf',
          contentType: 'application/pdf',
        })
        .expect(400)

      expect(res.body.file).toBeUndefined()
      expect(res.body.message).toBe('File size exceeds the limit of 20MB.')
    })

    it('CHARACTERIZED (LATENT BUG): a .docx is ACCEPTED by the PDF-only endpoint', async () => {
      // `case.controller.ts:692-695` asks for `ALLOWED_PDF_MIME_TYPES`, but the
      // restriction has no effect, for two independent reasons in
      // `libs/shared/pipelines/src/lib/file-type.pipe.ts`:
      //
      //   a) `validationOptions` is declared as a FIELD INITIALISER
      //      (file-type.pipe.ts:16-19). Field initialisers run after
      //      `super(validationOptions)`, so the base class's assignment is
      //      overwritten and EVERY call site's options are silently discarded.
      //      Measured: the instance always holds
      //      `{ mimetype: ALLOWED_MIME_TYPES, maxNumberOfFiles: 5 }`.
      //   b) the single-file branch of `isValid` ignores
      //      `this.validationOptions.mimetype` anyway and tests against the
      //      module-level `ALLOWED_MIME_TYPES` (file-type.pipe.ts:63).
      //
      // So a Word document passes an endpoint documented and coded as
      // PDF-only. This is independent of the Nest 11 bump; it is recorded here
      // because a reader who fixes the pipe will make this test fail, and that
      // failure is the correct signal.
      const res = await post('/probe/single-file')
        .attach('file', Buffer.from('PK fake docx'), {
          filename: 'skjal.docx',
          contentType:
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        })
        .expect(201)

      expect(res.body.file.mimetype).toBe(
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      )
      expect(res.body.file.originalname).toBe('skjal.docx')
    })

    it('CHARACTERIZED: a mimetype outside ALLOWED_MIME_TYPES is rejected with 400 and the extension-list message', async () => {
      const res = await post('/probe/single-file')
        .attach('file', Buffer.from('PNG not really'), {
          filename: 'mynd.png',
          contentType: 'image/png',
        })
        .expect(400)

      expect(res.body.file).toBeUndefined()
      expect(res.body.message).toBe(
        'File type .png is not allowed, allowed types are pdf, doc, dot, docx',
      )
    })
  })

  describe('2. bodyless and empty-body requests to a JSON endpoint', () => {
    it('NEST 11 BASELINE: no body at all -> 201 and `req.body` is UNDEFINED, not {}', async () => {
      const res = await post('/probe/json').expect(201)

      // The expectation this file was written to catch, and it moved as
      // predicted. A Node HTTP client sends `content-length: 0` and no
      // content-type here, so no parser claims the request and body-parser takes
      // its SKIP path, which in 2.x leaves `req.body === undefined`
      // (lib/read.js:45-48). On Nest 10 this read 'object' / false / [] / {}.
      //
      // Consequence for handler code: `Object.keys(body)` and `{ ...body }` now
      // throw a TypeError where they used to yield [] and {}. The probe above
      // guards its own `Object.keys` with a typeof check, which is why it can
      // report the shape instead of 500-ing.
      expect(res.body.typeofBody).toBe('undefined')
      expect(res.body.isUndefined).toBe(true)
      expect(res.body.keys).toBeNull()
      expect(res.body.body).toBeNull()
    })

    it('CHARACTERIZED: `content-type: application/json` with a literal empty string body -> 201 and {}', async () => {
      const res = await post('/probe/json')
        .set('content-type', 'application/json')
        .send('')
        .expect(201)

      // body-parser special-cases a zero-length JSON body to `{}` in BOTH 1.x
      // and 2.x (json.js:79-83 / json.js:102-106), so this one is expected to
      // survive the bump even though the bodyless case above does not.
      expect(res.body.typeofBody).toBe('object')
      expect(res.body.keys).toEqual([])
    })

    it('CHARACTERIZED: `{}` as an explicit body -> 201 and {}', async () => {
      const res = await post('/probe/json')
        .set('content-type', 'application/json')
        .send('{}')
        .expect(201)

      expect(res.body.keys).toEqual([])
    })

    it('CHARACTERIZED: a DTO-validated endpoint turns a MISSING body into a 400 field error, not a crash', async () => {
      const res = await post('/probe/json-dto').expect(400)

      // Because `req.body` is `{}` today, ValidationPipe validates an empty
      // object and reports the missing property. Under body-parser 2 the value
      // handed to the pipe is `undefined`; ValidationPipe substitutes `{}` for
      // an undefined body, so this 400 is expected to survive -- but the
      // message array is exactly what to re-check.
      expect(res.body.message).toEqual([
        {
          property: 'name',
          constraints: { isString: 'name must be a string' },
        },
      ])
    })

    it('CHARACTERIZED: malformed JSON is a 400 raised by body-parser, so it does NOT get the ExceptionFactoryPipe shape', async () => {
      const res = await post('/probe/json')
        .set('content-type', 'application/json')
        .send('{"name":')
        .expect(400)

      // The error comes from middleware, so no handler ran and there is no
      // parsed payload. Nest maps body-parser's SyntaxError to a
      // BadRequestException, which is why the message quotes the raw input.
      expect(res.body.typeofBody).toBeUndefined()
      expect(res.body.statusCode).toBe(400)
      expect(res.body.message).toContain('Unexpected end of JSON input')
    })
  })

  describe('3. `content-length: 0`, separately from bodyless', () => {
    // The discriminator is not "is there a body" but "does a parser READ the
    // request". body-parser reads when `type-is.hasBody()` is true (a
    // `content-length` -- even `0` -- or a `transfer-encoding` is present) AND
    // the content-type matches. On the read path a zero-length JSON body hits
    // an explicit special case that returns `{}` in body-parser 1.x and 2.x
    // alike. On either skip path, 1.x leaves the `{}` it pre-assigned and 2.x
    // leaves `undefined`. So these three cases agree today and split later.

    it('CHARACTERIZED: `content-length: 0` WITH a JSON content-type -> 201 and {} -- the READ path', async () => {
      const res = await post('/probe/json')
        .set('content-type', 'application/json')
        .set('content-length', '0')
        .send('')
        .expect(201)

      // Expected to survive the bump: this is the zero-length special case,
      // not the skip path.
      expect(res.body.typeofBody).toBe('object')
      expect(res.body.isUndefined).toBe(false)
      expect(res.body.keys).toEqual([])
    })

    it('NEST 11 BASELINE: `content-length: 0` with NO content-type -> 201 and UNDEFINED -- the SKIP path', async () => {
      // Sent over a socket on purpose: superagent's `.send('')` quietly sets
      // `content-type: application/x-www-form-urlencoded`, which would put this
      // request on the read path and make the test measure the opposite of what
      // its name claims.
      //
      // Was 'object' / false / [] on Nest 10. Contrast the READ-path test above,
      // which is unchanged -- the content-type is the whole difference.
      const response = await rawRequest(port, [
        'POST /probe/json HTTP/1.1',
        'Host: 127.0.0.1',
        'Content-Length: 0',
      ])

      expect(response).toContain('HTTP/1.1 201')
      expect(response).toContain('"typeofBody":"undefined"')
      expect(response).toContain('"isUndefined":true')
      expect(response).toContain('"keys":null')
    })

    it('NEST 11 BASELINE: no content-length header at all, WITH a JSON content-type -> 201 and UNDEFINED -- also the SKIP path', async () => {
      // Was 'object' / false / [] on Nest 10. A matching content-type is not
      // enough on its own: with no content-length and no transfer-encoding there
      // is nothing to read, so body-parser skips rather than hitting its
      // zero-length special case.
      const response = await rawRequest(port, [
        'POST /probe/json HTTP/1.1',
        'Host: 127.0.0.1',
        'Content-Type: application/json',
      ])

      expect(response).toContain('HTTP/1.1 201')
      expect(response).toContain('"typeofBody":"undefined"')
      expect(response).toContain('"isUndefined":true')
      expect(response).toContain('"keys":null')
    })
  })

  describe('4. limit enforcement -- the 8mb json limit from main.ts:29', () => {
    it('CHARACTERIZED: 200KB of JSON is ACCEPTED -- the 8mb limit really is in force, not just declared', async () => {
      // Nest's own default is 100kb, so a 200KB body is the smallest payload
      // that distinguishes "main.ts's limit applies" from "the default
      // applies". Contrast official-journal-application-api, which configures
      // nothing and rejects this same request with 413.
      const filler = 'a'.repeat(200 * 1024)
      const res = await post('/probe/json')
        .set('content-type', 'application/json')
        .send(JSON.stringify({ name: filler }))
        .expect(201)

      expect(res.body.keys).toEqual(['name'])
      expect(res.body.body.name.length).toBe(200 * 1024)
    })

    it('CHARACTERIZED: JSON above 8mb is 413 with `{ statusCode, message }`, produced by Nest\'s external-exception handler', async () => {
      // '8mb' is 8 * 1024 * 1024 = 8388608 bytes to the `bytes` library.
      const filler = 'a'.repeat(8 * 1024 * 1024)
      const res = await post('/probe/json')
        .set('content-type', 'application/json')
        .send(JSON.stringify({ name: filler }))

      expect(res.status).toBe(413)
      // The throw happens in middleware, so there is no parsed payload. It does
      // NOT fall through to Express's HTML error page: Nest registers an
      // error-handling layer that recognises a body-parser HttpError by its
      // `statusCode` and re-emits it as JSON. That handler is Nest code, so the
      // exact envelope is in scope for the bump as much as the status is.
      expect(res.body.keys).toBeUndefined()
      expect(res.body).toEqual({
        statusCode: 413,
        message: 'request entity too large',
      })
    })

    it('CHARACTERIZED: urlencoded above 8mb is also 413 with the same envelope', async () => {
      const res = await post('/probe/urlencoded')
        .set('content-type', 'application/x-www-form-urlencoded')
        .send(`name=${'a'.repeat(8 * 1024 * 1024)}`)

      expect(res.status).toBe(413)
      expect(res.body.keys).toBeUndefined()
      expect(res.body).toEqual({
        statusCode: 413,
        message: 'request entity too large',
      })
    })

    it('CHARACTERIZED: multipart is NOT subject to the 8mb limit -- json/urlencoded skip it and multer has no cap', async () => {
      // Recorded deliberately: reading `main.ts` suggests an 8mb ceiling on
      // request bodies, but the upload endpoints bypass it entirely. The only
      // ceiling on an upload is the 20MB post-hoc validator, which runs after
      // the bytes are already in memory.
      const nineMegabytes = Buffer.alloc(ONE_MEGA_BYTE * 9, 0x41)

      const res = await post('/probe/single-file')
        .attach('file', nineMegabytes, {
          filename: 'nine.pdf',
          contentType: 'application/pdf',
        })
        .expect(201)

      expect(res.body.file.size).toBe(ONE_MEGA_BYTE * 9)
    })
  })

  describe('6. wrong content-type', () => {
    it('CHARACTERIZED: JSON sent to the multipart endpoint -> 400 "File is required", not a 500', async () => {
      const res = await post('/probe/single-file')
        .set('content-type', 'application/json')
        .send(JSON.stringify({ file: 'skjal.pdf' }))
        .expect(400)

      // multer ignores a non-multipart request and calls next() with
      // `req.file` undefined; ParseFilePipe's `fileIsRequired` default catches
      // it before any validator can dereference the missing file.
      expect(res.body.file).toBeUndefined()
      expect(res.body.message).toBe('File is required')
    })

    it('NEST 11 BASELINE: multipart sent to a JSON endpoint -> the body is UNDEFINED and the file fields are LOST', async () => {
      const res = await post('/probe/json')
        .attach('file', PDF_BYTES, {
          filename: 'skjal.pdf',
          contentType: 'application/pdf',
        })
        .expect(201)

      // No parser claims multipart, so nothing populates `req.body` and the
      // request stream is left unread -- the SKIP path again. Was 'object' / []
      // on Nest 10. The file is lost either way.
      expect(res.body.typeofBody).toBe('undefined')
      expect(res.body.keys).toBeNull()
    })

    it('NEST 11 BASELINE: a JSON body under `content-type: text/plain` is NOT parsed -- body is UNDEFINED', async () => {
      const res = await post('/probe/json')
        .set('content-type', 'text/plain')
        .send('{"name":"a"}')
        .expect(201)

      // Also the SKIP path -- no parser matches text/plain. Was [] on Nest 10.
      expect(res.body.keys).toBeNull()
    })
  })

  describe('7. urlencoded({ extended: true }) -- nested and bracketed bodies', () => {
    it('CHARACTERIZED: `a[b]=1` becomes a nested object (qs, i.e. extended: true)', async () => {
      const res = await post('/probe/urlencoded')
        .set('content-type', 'application/x-www-form-urlencoded')
        .send('a[b]=1')
        .expect(201)

      // Express 5 flips `express.urlencoded`'s `extended` default to false, but
      // main.ts:30 passes `extended: true` explicitly, so this is expected to
      // survive. It is recorded because it is the body-side twin of the query
      // parser flip already characterized in query-string-parsing.spec.ts, and
      // because deleting that explicit option would now change behaviour.
      expect(res.body.body).toEqual({ a: { b: '1' } })
    })

    it('CHARACTERIZED: `a[]=1&a[]=2` becomes an array', async () => {
      const res = await post('/probe/urlencoded')
        .set('content-type', 'application/x-www-form-urlencoded')
        .send('a[]=1&a[]=2')
        .expect(201)

      expect(res.body.body).toEqual({ a: ['1', '2'] })
    })

    it('CHARACTERIZED: a repeated flat key becomes an array', async () => {
      const res = await post('/probe/urlencoded')
        .set('content-type', 'application/x-www-form-urlencoded')
        .send('a=1&a=2')
        .expect(201)

      expect(res.body.body).toEqual({ a: ['1', '2'] })
    })

    it('CHARACTERIZED: a single flat key stays a bare string', async () => {
      const res = await post('/probe/urlencoded')
        .set('content-type', 'application/x-www-form-urlencoded')
        .send('a=1')
        .expect(201)

      expect(res.body.body).toEqual({ a: '1' })
    })
  })

  describe('the credentials trap: a guard runs BEFORE the body is read', () => {
    // This block exists to prove the payload assertions above are not the kind
    // of test that passes on a rejected request. Nest runs guards before
    // interceptors, so an unauthenticated multipart POST is answered without
    // multer ever running. A test that asserted only on a status code would be
    // watching TokenJwtAuthGuard, not the parser.

    beforeEach(() => {
      guardedHandlerRan = false
    })

    it('SPECIFIED: without an Authorization header the request is 401 and the handler NEVER RUNS', async () => {
      const res = await post('/guarded/single-file')
        .attach('file', PDF_BYTES, {
          filename: 'skjal.pdf',
          contentType: 'application/pdf',
        })
        .expect(401)

      expect(res.body.message).toBe('Authorization header is missing')
      // The proof: the body was a perfectly valid multipart upload, and no
      // part of the parsing path was reached.
      expect(guardedHandlerRan).toBe(false)
      expect(res.body.file).toBeUndefined()
    })

    it('SPECIFIED: the same endpoint parses the file once the guard is satisfied', async () => {
      // Contrast case. A bearer token that the guard accepts would need the
      // real JWKS endpoint, so the guard is overridden here -- the point is
      // only that the SAME request body does reach multer when the guard says
      // yes, which is what makes the 401 above meaningful.
      const moduleRef = await Test.createTestingModule({
        controllers: [GuardedProbeController],
      })
        .overrideGuard(TokenJwtAuthGuard)
        .useValue({ canActivate: () => true })
        .compile()

      const openApp = moduleRef.createNestApplication()
      await openApp.init()

      try {
        const res = await request(openApp.getHttpServer())
          .post('/guarded/single-file')
          .attach('file', PDF_BYTES, {
            filename: 'skjal.pdf',
            contentType: 'application/pdf',
          })
          .expect(201)

        expect(guardedHandlerRan).toBe(true)
        expect(res.body.file.originalname).toBe('skjal.pdf')
        expect(res.body.file.bufferUtf8).toBe(PDF_BYTES.toString('utf8'))
      } finally {
        await openApp.close()
      }
    })
  })
})
