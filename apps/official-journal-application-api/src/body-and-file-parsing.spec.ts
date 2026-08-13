/**
 * Characterization tests for multi-file upload and for the DEFAULT body-parser
 * configuration -- official-journal-application-api calls no `app.use(...)` at
 * all, so everything here is whatever Nest 10 / Express 4 hands out.
 *
 * WHY THIS EXISTS
 * `official-journal-api`, `official-journal-application-api` and
 * `legal-gazette-api` configure no body parser. "We never configured it" is
 * exactly where a default shift lands unnoticed, and Nest 11 brings Express 5
 * and `body-parser` 2.x:
 *
 *   1. `body-parser` 1.20 does `req.body = req.body || {}` before deciding
 *      whether there is a body (lib/types/json.js:112). 2.3 replaced that with
 *      `if (!('body' in req)) req.body = undefined` (lib/read.js:45-48). A
 *      request with no body therefore yields `{}` today and `undefined` after.
 *   2. Nest's own registration passes no `limit`, so the ceiling is
 *      body-parser's own 100kb default -- a number that appears nowhere in this
 *      repo. Test 4 below pins it, because a silent change to it would change
 *      which requests these three APIs accept.
 *   3. `express.urlencoded`'s `extended` default flips to false in Express 5.
 *      Nest passes `extended: true` explicitly
 *      (express-adapter.js:159-161), so test 7 records the nested-body
 *      behaviour rather than guarding a default -- but it is Nest's code doing
 *      that, and Nest is what is being upgraded.
 *
 * LABELS
 *   CHARACTERIZED -- measured against Express 4.22.2 / body-parser 1.20.6 /
 *                    multer 2.2.0 / Nest 10.4 as committed. A later reader may
 *                    change these when the bump lands, deliberately.
 *   SPECIFIED     -- a decision. Changing it needs a new decision.
 *
 * THE FUTURE WAS SIMULATED, NOT GUESSED
 * Nest's parser registration does `require('body-parser')`, so mocking that one
 * module swaps the whole parsing layer. This file was run with
 *   jest.mock('body-parser', () => require('<path to a real body-parser@2.3.0>'))
 * prepended, against Nest 10 / Express 4 otherwise untouched. Exactly two tests
 * reddened, both body-parser SKIP-path cases:
 *   - "no body at all -> {} not undefined"
 *   - "multipart sent to a JSON endpoint -> body is {}"
 * The 100kb ceiling, the 413 envelope and every multipart assertion were
 * unaffected. The version canary reads `body-parser/package.json` and so stays
 * green under that mock; it fires only on a real dependency change.
 *
 * WHAT IS MIRRORED FROM PRODUCTION
 *   - No `app.use(...)`, matching `main.ts`.
 *   - `ExceptionFactoryPipe()` as the global pipe.
 *   - `FilesInterceptor('files')` with no options, plus the `ParseFilePipe`
 *     stack of `application.controller.ts:196-213` -- `MaxFileSizeValidator` at
 *     20MB and `FileTypeValidationPipe` with `ALLOWED_MIME_TYPES` and
 *     `maxNumberOfFiles: 10`.
 *
 * Every test asserts on the parsed payload, never on a status code alone. The
 * real endpoint sits behind `TokenJwtAuthGuard` + `ApplicationGuard`, which
 * reject before any interceptor runs; the sibling spec in
 * `official-journal-admin-api` proves that with a handler-reached flag.
 */
import { readFileSync } from 'node:fs'
import request from 'supertest'

import type { INestApplication } from '@nestjs/common'
import {
  Body,
  Controller,
  MaxFileSizeValidator,
  ParseFilePipe,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common'
import { FilesInterceptor } from '@nestjs/platform-express'
import { Test } from '@nestjs/testing'

import { ALLOWED_MIME_TYPES, ONE_MEGA_BYTE } from '@dmr.is/constants'
import {
  ExceptionFactoryPipe,
  FileTypeValidationPipe,
} from '@dmr.is/pipelines'

/**
 * Read an installed dependency's version off disk. `require.resolve` rather than
 * a JSON import because `resolveJsonModule` is not enabled in this workspace,
 * and rather than `require()` because that trips
 * `@typescript-eslint/no-var-requires`.
 */
const packageVersion = (name: string): string => {
  const contents = readFileSync(require.resolve(`${name}/package.json`), 'utf8')

  return (JSON.parse(contents) as { version: string }).version
}

const describeFile = (file: Express.Multer.File) => ({
  fieldname: file.fieldname,
  originalname: file.originalname,
  mimetype: file.mimetype,
  encoding: file.encoding,
  size: file.size,
  bufferIsBuffer: Buffer.isBuffer(file.buffer),
  bufferUtf8: file.buffer?.toString('utf8'),
})

@Controller('probe')
class ProbeController {
  @Post('files')
  @UseInterceptors(FilesInterceptor('files'))
  files(
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({
            maxSize: ONE_MEGA_BYTE * 20,
            message: `File size exceeds the limit of 20MB.`,
          }),
          new FileTypeValidationPipe({
            mimetype: ALLOWED_MIME_TYPES,
            maxNumberOfFiles: 10,
          }),
        ],
      }),
    )
    files: Array<Express.Multer.File>,
  ) {
    return { count: files.length, files: files.map(describeFile) }
  }

  @Post('json')
  json(@Body() body: unknown) {
    return {
      typeofBody: typeof body,
      isUndefined: body === undefined,
      keys:
        body !== null && typeof body === 'object' ? Object.keys(body) : null,
      body: body ?? null,
    }
  }

  @Post('urlencoded')
  urlencodedBody(@Body() body: unknown) {
    return { body: body ?? null }
  }
}

const PDF_BYTES = Buffer.from('%PDF-1.7 fyrsta\n')
const DOCX_MIME =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

describe('body + multi-file parsing (official-journal-application-api, Express 4 defaults)', () => {
  let app: INestApplication

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ProbeController],
    }).compile()

    app = moduleRef.createNestApplication()
    // Deliberately no app.use(...): main.ts configures no body parser, so the
    // limits measured below are Nest's and body-parser's defaults.
    app.useGlobalPipes(ExceptionFactoryPipe())
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  const post = (url: string) => request(app.getHttpServer()).post(url)

  describe('the environment under test', () => {
    it('CHARACTERIZED: Express 4 / body-parser 1.x, and NOTHING in main.ts overrides the parsers', () => {
      expect(packageVersion('express')).toMatch(/^4\./)
      expect(packageVersion('body-parser')).toMatch(/^1\./)

      // Nest registered its own pair, one each. If main.ts ever adds an
      // `app.use(json(...))`, Nest's name-based dedup
      // (express-adapter.js:166-168) keeps this at 1 rather than making it 2 --
      // so this assertion says "a parser is installed", not "ours is".
      // Express 5 renames `app._router` to `app.router`.
      const names = app
        .getHttpAdapter()
        .getInstance()
        ._router.stack.map((layer: { name: string }) => layer.name)

      expect(names.filter((n: string) => n === 'jsonParser')).toHaveLength(1)
      expect(names.filter((n: string) => n === 'urlencodedParser')).toHaveLength(
        1,
      )
    })
  })

  describe('1. successful multipart upload -- FilesInterceptor(\'files\')', () => {
    it('CHARACTERIZED: several files arrive in send order with filename, mimetype, size and buffer intact', async () => {
      const second = Buffer.from('PK docx onnur skra')

      const res = await post('/probe/files')
        .attach('files', PDF_BYTES, {
          filename: 'fyrsta.pdf',
          contentType: 'application/pdf',
        })
        .attach('files', second, {
          filename: 'onnur.docx',
          contentType: DOCX_MIME,
        })
        .expect(201)

      expect(res.body.count).toBe(2)
      expect(res.body.files).toEqual([
        {
          fieldname: 'files',
          originalname: 'fyrsta.pdf',
          mimetype: 'application/pdf',
          encoding: '7bit',
          size: 16,
          bufferIsBuffer: true,
          bufferUtf8: '%PDF-1.7 fyrsta\n',
        },
        {
          fieldname: 'files',
          originalname: 'onnur.docx',
          mimetype: DOCX_MIME,
          encoding: '7bit',
          size: 18,
          bufferIsBuffer: true,
          bufferUtf8: 'PK docx onnur skra',
        },
      ])
    })

    it('CHARACTERIZED: a single file still arrives as a one-element array', async () => {
      const res = await post('/probe/files')
        .attach('files', PDF_BYTES, {
          filename: 'fyrsta.pdf',
          contentType: 'application/pdf',
        })
        .expect(201)

      expect(res.body.count).toBe(1)
      expect(res.body.files[0].originalname).toBe('fyrsta.pdf')
      expect(res.body.files[0].bufferUtf8).toBe('%PDF-1.7 fyrsta\n')
    })

    it('CHARACTERIZED (LATENT BUG): an Icelandic filename is MOJIBAKED -- busboy decodes it as latin1', async () => {
      const res = await post('/probe/files')
        .attach('files', PDF_BYTES, {
          filename: 'auglýsing-þingið.pdf',
          contentType: 'application/pdf',
        })
        .expect(201)

      // Browsers put raw UTF-8 bytes in the multipart `filename` parameter.
      // multer 2 / busboy decode that as latin1 unless `defParamCharset:
      // 'utf8'` is passed, which `FilesInterceptor('files')` does not do. The
      // mangled name is what `uploadAttachments` then sends to S3, and it is
      // also what the debug log at application.controller.ts:215-218 prints.
      //
      // Pinned as the exact mangled string rather than "not equal to the input"
      // so that a fix produces a failure that says what changed. Independent of
      // the Nest 11 bump -- but note busboy is a multer dependency, so a
      // charset default change would land here silently.
      expect(res.body.files[0].originalname).toBe('auglÃ½sing-Ã¾ingiÃ°.pdf')
      expect(res.body.files[0].originalname).not.toBe('auglýsing-þingið.pdf')
    })

    it('CHARACTERIZED (LATENT BUG): 12 files are ACCEPTED -- `maxNumberOfFiles` is never enforced anywhere', async () => {
      // `application.controller.ts:208` passes `maxNumberOfFiles: 10`. Nothing
      // enforces it, for two independent reasons:
      //
      //   a) `FileTypeValidationPipe` declares `validationOptions` as a FIELD
      //      INITIALISER (file-type.pipe.ts:16-19). Field initialisers run
      //      after `super(validationOptions)`, so the base class's assignment
      //      is overwritten and every call site's options are silently
      //      discarded. Measured directly: the instance always holds
      //      `{ mimetype: ALLOWED_MIME_TYPES, maxNumberOfFiles: 5 }`.
      //   b) even that 5 never applies, because `ParseFilePipe` validates
      //      PER FILE -- `validateFilesOrFile` does
      //      `value.map(f => this.validate(f))`
      //      (@nestjs/common/pipes/file/parse-file.pipe.js). `isValid` is
      //      therefore never handed an array, so the entire
      //      `Array.isArray(files)` branch of the pipe (file-type.pipe.ts:53-61)
      //      -- both the count check and the `.some()` call -- is dead code.
      //
      // Net effect: an unbounded number of attachments, each buffered whole in
      // memory, reaches the handler and then S3. Recorded rather than fixed:
      // this is a pre-existing hole, not something the Nest 11 bump introduces.
      const upload = post('/probe/files')
      for (let i = 0; i < 12; i++) {
        upload.attach('files', Buffer.from(`pdf-${i}`), {
          filename: `skjal-${i}.pdf`,
          contentType: 'application/pdf',
        })
      }

      const res = await upload.expect(201)

      expect(res.body.count).toBe(12)
      expect(res.body.files[11].bufferUtf8).toBe('pdf-11')
    })

    it('CHARACTERIZED: 5 files are accepted, and all five payloads arrive in order', async () => {
      const upload = post('/probe/files')
      for (let i = 0; i < 5; i++) {
        upload.attach('files', Buffer.from(`pdf-${i}`), {
          filename: `skjal-${i}.pdf`,
          contentType: 'application/pdf',
        })
      }

      const res = await upload.expect(201)

      expect(res.body.count).toBe(5)
      expect(
        res.body.files.map((f: { bufferUtf8: string }) => f.bufferUtf8),
      ).toEqual(['pdf-0', 'pdf-1', 'pdf-2', 'pdf-3', 'pdf-4'])
    })

    it('CHARACTERIZED: ONE disallowed type in a batch rejects the WHOLE batch with 400 -- per-file validation, so `.some()` never runs', async () => {
      // The contrast case for the dead-code note above. Read on its own,
      // `FileTypeValidationPipe.isValid`'s `files.some(...)` says "one good
      // file waves the batch through". Measured through `ParseFilePipe` the
      // opposite happens, because the array branch is never reached: each file
      // is validated alone and the first failure throws. The message naming
      // `.png` is the proof -- an array argument would have produced a message
      // with no extension in it.
      const res = await post('/probe/files')
        .attach('files', PDF_BYTES, {
          filename: 'ok.pdf',
          contentType: 'application/pdf',
        })
        .attach('files', Buffer.from('not a png'), {
          filename: 'mynd.png',
          contentType: 'image/png',
        })
        .expect(400)

      expect(res.body.files).toBeUndefined()
      expect(res.body.message).toBe(
        'File type .png is not allowed, allowed types are pdf, doc, dot, docx',
      )
    })

    it('CHARACTERIZED: one oversized file fails the whole batch with the 20MB message', async () => {
      const res = await post('/probe/files')
        .attach('files', PDF_BYTES, {
          filename: 'ok.pdf',
          contentType: 'application/pdf',
        })
        .attach('files', Buffer.alloc(ONE_MEGA_BYTE * 20 + 1, 0x41), {
          filename: 'huge.pdf',
          contentType: 'application/pdf',
        })
        .expect(400)

      expect(res.body.files).toBeUndefined()
      expect(res.body.message).toBe('File size exceeds the limit of 20MB.')
    })
  })

  describe('2. bodyless and empty-body requests to a JSON endpoint', () => {
    it('CHARACTERIZED: no body at all -> 201 and `req.body` is an EMPTY OBJECT, not undefined', async () => {
      const res = await post('/probe/json').expect(201)

      // The highest-value line in this file. Under body-parser 2 the same
      // request leaves `req.body === undefined`, so `typeofBody` becomes
      // 'undefined', `isUndefined` becomes true and `keys` becomes null.
      expect(res.body.typeofBody).toBe('object')
      expect(res.body.isUndefined).toBe(false)
      expect(res.body.keys).toEqual([])
      expect(res.body.body).toEqual({})
    })

    it('CHARACTERIZED: an empty-string JSON body -> 201 and {} (body-parser special-cases zero length in 1.x AND 2.x)', async () => {
      const res = await post('/probe/json')
        .set('content-type', 'application/json')
        .send('')
        .expect(201)

      expect(res.body.typeofBody).toBe('object')
      expect(res.body.keys).toEqual([])
    })
  })

  describe('3. `content-length: 0`, separately from bodyless', () => {
    it('CHARACTERIZED: `content-length: 0` + JSON content-type -> 201 and {}', async () => {
      // Distinct path from the bodyless case: `type-is.hasBody()` is TRUE here
      // (`!isNaN('0')`), so body-parser runs its read path and hits the
      // zero-length special case instead of skipping. The two land on the same
      // value under body-parser 1 and are expected to DIVERGE under 2, where
      // only the skipping branch yields `undefined`.
      const res = await post('/probe/json')
        .set('content-type', 'application/json')
        .set('content-length', '0')
        .send('')
        .expect(201)

      expect(res.body.typeofBody).toBe('object')
      expect(res.body.isUndefined).toBe(false)
      expect(res.body.keys).toEqual([])
    })
  })

  describe('4. limit enforcement -- the UNCONFIGURED default', () => {
    it('CHARACTERIZED: 90KB of JSON is accepted and arrives whole', async () => {
      const filler = 'a'.repeat(90 * 1024)
      const res = await post('/probe/json')
        .set('content-type', 'application/json')
        .send(JSON.stringify({ name: filler }))
        .expect(201)

      expect(res.body.keys).toEqual(['name'])
      expect(res.body.body.name.length).toBe(90 * 1024)
    })

    it('CHARACTERIZED: 200KB of JSON is 413 -- the default ceiling is 100kb, a number written nowhere in this repo', async () => {
      // official-journal-admin-api accepts this exact request because main.ts
      // raises the limit to 8mb. This app does not, and nothing in the codebase
      // says so.
      const filler = 'a'.repeat(200 * 1024)
      const res = await post('/probe/json')
        .set('content-type', 'application/json')
        .send(JSON.stringify({ name: filler }))

      expect(res.status).toBe(413)
      expect(res.body.keys).toBeUndefined()
      expect(res.body).toEqual({
        statusCode: 413,
        message: 'request entity too large',
      })
    })

    it('CHARACTERIZED: a 9MB multipart upload is accepted -- the 100kb ceiling does NOT apply to uploads', async () => {
      const res = await post('/probe/files')
        .attach('files', Buffer.alloc(ONE_MEGA_BYTE * 9, 0x41), {
          filename: 'nine.pdf',
          contentType: 'application/pdf',
        })
        .expect(201)

      expect(res.body.files[0].size).toBe(ONE_MEGA_BYTE * 9)
    })
  })

  describe('6. wrong content-type', () => {
    it('CHARACTERIZED: JSON sent to the multipart endpoint -> 400 "File is required"', async () => {
      const res = await post('/probe/files')
        .set('content-type', 'application/json')
        .send(JSON.stringify({ files: [] }))
        .expect(400)

      expect(res.body.files).toBeUndefined()
      expect(res.body.message).toBe('File is required')
    })

    it('CHARACTERIZED: multipart sent to a JSON endpoint -> body is {} and the files are LOST', async () => {
      const res = await post('/probe/json')
        .attach('files', PDF_BYTES, {
          filename: 'fyrsta.pdf',
          contentType: 'application/pdf',
        })
        .expect(201)

      expect(res.body.typeofBody).toBe('object')
      expect(res.body.keys).toEqual([])
    })
  })

  describe('7. urlencoded -- Nest passes extended: true on your behalf', () => {
    it('CHARACTERIZED: `a[b]=1` becomes a nested object', async () => {
      const res = await post('/probe/urlencoded')
        .set('content-type', 'application/x-www-form-urlencoded')
        .send('a[b]=1')
        .expect(201)

      expect(res.body.body).toEqual({ a: { b: '1' } })
    })

    it('CHARACTERIZED: `a[]=1&a[]=2` becomes an array', async () => {
      const res = await post('/probe/urlencoded')
        .set('content-type', 'application/x-www-form-urlencoded')
        .send('a[]=1&a[]=2')
        .expect(201)

      expect(res.body.body).toEqual({ a: ['1', '2'] })
    })
  })
})
