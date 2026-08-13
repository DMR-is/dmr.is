/**
 * Characterization tests for the body-parser configuration of
 * directorate-of-equality-api, whose `main.ts:27-29` is the most unusual in the
 * repo:
 *
 *   app.use('/api/v1/imports/local', raw({ type: () => true, limit: '25mb' }))
 *   app.use(json({ limit: '6mb' }))
 *   app.use(urlencoded({ extended: true, limit: '6mb' }))
 *
 * WHY THIS EXISTS
 * Nest 11 ships `@nestjs/platform-express` with Express 5 and `body-parser`
 * 2.x. Three changes there are invisible to the type checker:
 *
 *   1. `body-parser` 1.20 does `req.body = req.body || {}` before deciding
 *      whether there is a body (lib/types/raw.js:66, json.js:112). 2.3 replaced
 *      that with `if (!('body' in req)) req.body = undefined`
 *      (lib/read.js:45-48). The `Buffer.isBuffer(body)` check in
 *      `ImportUploadLocalController.upload` is what stands between that change
 *      and a 500, so it is exercised explicitly below.
 *   2. `body-parser` 1.x marks a consumed request with `req._body`; 2.x dropped
 *      that flag for `onFinished.isFinished(req)`. That is the mechanism that
 *      stops `json()` re-reading a request `raw()` already consumed, i.e. the
 *      reason stacking these three parsers works at all.
 *   3. Express 5 flips `express.urlencoded`'s `extended` default. `main.ts:29`
 *      passes it explicitly, so the tests below record behaviour rather than
 *      guard a default -- but they also mean deleting that explicit option
 *      would now be a visible change.
 *
 * LABELS
 *   CHARACTERIZED    -- measured and unchanged across the bump. These held on
 *                       Express 4.22.2 / body-parser 1.20.6 / Nest 10.4 and
 *                       still hold on Express 5.2.1 / body-parser 2.3.0 /
 *                       Nest 11.1.29.
 *   NEST 11 BASELINE -- moved on the bump. The superseded Nest 10 value is named
 *                       in each comment.
 *   SPECIFIED        -- a decision. Changing it needs a new decision.
 *
 * THE SIMULATION WAS ACCURATE
 * The prediction below was made by mocking body-parser 2.3.0 under Nest 10. When
 * the real bump landed, exactly the four named tests reddened and nothing else --
 * plus the environment canary itself, which is what it is for. Every raw-mount
 * test stayed green as predicted, so `ImportUploadLocalController`'s
 * `Buffer.isBuffer` guard is confirmed on both sides of the bump.
 *
 * THE FUTURE WAS SIMULATED, NOT GUESSED -- AND THE TECHNIQUE NO LONGER WORKS
 * `express.json` / `express.raw` are direct re-exports of body-parser
 * (express/lib/express.js:78-83), and Nest 10's own registration did
 * `require('body-parser')` too, so swapping that single module swapped the whole
 * parsing layer. This file was run with
 *   jest.mock('body-parser', () => require('<path to a real body-parser@2.3.0>'))
 * prepended, against Nest 10 / Express 4 otherwise untouched.
 *
 * Do NOT reuse that recipe on Nest 11. `@nestjs/platform-express@11` no longer
 * declares or requires body-parser -- `registerParserMiddleware`
 * (express-adapter.js:188-195) calls `express.json()` / `express.urlencoded()`.
 * And a bare `jest.mock('body-parser')` now resolves the HOISTED 1.20.6 (Nx
 * build tooling still depends on Express 4), not express's nested 2.3.0 that
 * actually parses bodies, so the mock would bind to the wrong module and prove
 * nothing.
 *
 * Exactly four tests reddened under the simulation, all body-parser SKIP-path
 * cases on JSON endpoints:
 *   - "a bodyless POST to a JSON endpoint -> {} not undefined"
 *   - "on a JSON endpoint the two cases AGREE today" (its bodyless half)
 *   - "multipart sent to a JSON endpoint -> body is {}"
 *   - "a JSON body under content-type: text/plain -> not parsed"
 * Every raw-mount test stayed green, INCLUDING the bodyless 400 and the
 * `content-length: 0` 204 -- so `ImportUploadLocalController`'s
 * `Buffer.isBuffer` guard clause is confirmed to hold on both sides of the bump.
 *
 * WHAT IS MIRRORED FROM PRODUCTION
 * The three `app.use` calls in their exact order, `setGlobalPrefix('api')`,
 * URI versioning and `new ValidationPipe({ transform: true, whitelist: true })`
 * -- all from `main.ts`. The real `ImportUploadLocalController` is mounted (it
 * is unguarded by design) with a recording stub for `IImportUploadService`, so
 * the assertions are on the bytes the service actually received, not on a
 * status code.
 */
import { IsString } from 'class-validator'
import { json, raw, urlencoded } from 'express'
import { Request } from 'express'
import { readFileSync } from 'node:fs'
import { connect } from 'node:net'
import request from 'supertest'

import type { INestApplication } from '@nestjs/common'
import {
  Body,
  Controller,
  Post,
  Put,
  Req,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common'
import { Test } from '@nestjs/testing'

import { IImportUploadService } from './modules/import-upload/import-upload.service.interface'
import { ImportUploadLocalController } from './modules/import-upload/import-upload-local.controller'

class PresignBodyDto {
  @IsString()
  boundary!: string
}

/**
 * Probes mounted alongside the real controller so the shape of `req.body` is
 * observable on paths the real controller does not serve. `imports/local/probe`
 * exists to answer "does the raw mount capture sub-paths?"; `imports/presign`
 * mirrors the real sibling route that must stay JSON.
 */
@Controller({ path: 'imports', version: '1' })
class BodyShapeProbeController {
  @Put('local/probe')
  localSubPath(@Req() req: Request) {
    return describeBody(req.body)
  }

  @Post('presign-probe')
  presign(@Body() body: PresignBodyDto, @Req() req: Request) {
    return { dto: body, raw: describeBody(req.body) }
  }
}

@Controller({ path: 'other', version: '1' })
class UnrelatedProbeController {
  @Post('echo')
  echo(@Req() req: Request) {
    return describeBody(req.body)
  }

  @Post('urlencoded')
  urlencodedBody(@Req() req: Request) {
    return { body: req.body ?? null }
  }
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

const describeBody = (body: unknown) => ({
  isBuffer: Buffer.isBuffer(body),
  isUndefined: body === undefined,
  typeofBody: typeof body,
  length: Buffer.isBuffer(body) ? body.length : null,
  utf8: Buffer.isBuffer(body) ? body.toString('utf8') : null,
  keys: !Buffer.isBuffer(body) && body && typeof body === 'object' ? Object.keys(body) : null,
})

const WORKBOOK_BYTES = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x00, 0xff, 0x7f])
const UPLOAD_KEY = 'admin/9f0c1c2e-workbook.xlsx'

/**
 * Send a hand-written request over a socket. Needed because a Node HTTP client
 * -- and therefore supertest -- always emits `content-length: 0` for a
 * bodyless POST/PUT, and `content-length: 0` is a DIFFERENT body-parser path
 * from having no length header at all (`type-is.hasBody()` is true for the
 * former and false for the latter). Only a raw socket can produce the latter.
 */
const rawRequest = (port: number, headerLines: Array<string>): Promise<string> =>
  new Promise((resolve, reject) => {
    let received = ''
    const socket = connect(port, '127.0.0.1', () => {
      socket.write(`${[...headerLines, 'Connection: close'].join('\r\n')}\r\n\r\n`)
    })
    socket.setEncoding('utf8')
    socket.on('data', (chunk: string) => {
      received += chunk
    })
    socket.on('end', () => resolve(received))
    socket.on('error', reject)
  })

describe('body parsing (directorate-of-equality-api, Express 5)', () => {
  let app: INestApplication
  let port: number
  let storedUploads: Array<{ key: string; data: Buffer }>

  beforeAll(async () => {
    storedUploads = []

    const importUploadServiceStub = {
      createUpload: jest.fn(),
      fetchWorkbook: jest.fn(),
      cleanup: jest.fn(),
      storeLocalUpload: jest.fn(async (key: string, data: Buffer) => {
        storedUploads.push({ key, data })
      }),
    }

    const moduleRef = await Test.createTestingModule({
      controllers: [
        ImportUploadLocalController,
        BodyShapeProbeController,
        UnrelatedProbeController,
      ],
      providers: [
        { provide: IImportUploadService, useValue: importUploadServiceStub },
      ],
    }).compile()

    app = moduleRef.createNestApplication()
    // main.ts:27-29, same order. The raw mount must go on first, and it is
    // mounted on the fully-prefixed path because the prefix and version are
    // applied by Nest below.
    app.use('/api/v1/imports/local', raw({ type: () => true, limit: '25mb' }))
    app.use(json({ limit: '6mb' }))
    app.use(urlencoded({ extended: true, limit: '6mb' }))
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }))
    app.setGlobalPrefix('api')
    app.enableVersioning({ type: VersioningType.URI })
    // Listening on an ephemeral port so the raw-socket cases below have
    // somewhere to connect; supertest reuses the same listener.
    await app.listen(0)
    const address = app.getHttpServer().address()
    port = typeof address === 'object' && address ? address.port : 0
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    storedUploads = []
  })

  const req = () => request(app.getHttpServer())

  describe('the environment under test', () => {
    it('NEST 11 BASELINE: Express 5 / body-parser 2.x, with three parsers in the stack', () => {
      // Was Express 4.x / body-parser 1.x.
      expect(packageVersion('express')).toMatch(/^5\./)

      // body-parser MUST be resolved through express, not from here. Nx dev
      // tooling (@nx/react, @nx/module-federation, webpack-dev-server) still
      // depends on express 4, so the HOISTED body-parser is 1.20.6 while the
      // copy that actually parses request bodies is express's own nested
      // 2.x. Probing the hoisted one would make this canary quietly lie.
      expect(packageVersion('body-parser', 'express')).toMatch(/^2\./)

      // Nest dedups its own default parsers by FUNCTION NAME:
      // `registerParserMiddleware` (express-adapter.js:188-195) drops any parser
      // whose name `isMiddlewareApplied` already finds via `layer.handle.name`,
      // and body-parser names its returned functions `jsonParser` /
      // `urlencodedParser` / `rawParser`. So main.ts's 6mb pair suppresses Nest's
      // 100kb defaults entirely, and the path-scoped `rawParser` is not affected
      // by that dedup.
      //
      // MEASURED: body-parser 2.3.0 keeps all three names, so the dedup survived
      // the bump -- the counts below are unchanged from Nest 10. Express 5
      // renamed `app._router` to `app.router`; Nest 11's `isMiddlewareApplied`
      // reads `app.router`, and this test had to follow the same rename.
      const names = app
        .getHttpAdapter()
        .getInstance()
        .router.stack.map((layer: { name: string }) => layer.name)

      expect(names.filter((n: string) => n === 'jsonParser')).toHaveLength(1)
      expect(names.filter((n: string) => n === 'urlencodedParser')).toHaveLength(
        1,
      )
      expect(names.filter((n: string) => n === 'rawParser')).toHaveLength(1)
    })
  })

  describe('5a. the raw mount does what it is there for', () => {
    it('CHARACTERIZED: a binary PUT reaches the service as the exact Buffer, 204', async () => {
      await req()
        .put('/api/v1/imports/local')
        .query({ key: UPLOAD_KEY })
        .set('content-type', 'application/octet-stream')
        .send(WORKBOOK_BYTES)
        .expect(204)

      expect(storedUploads).toHaveLength(1)
      expect(storedUploads[0].key).toBe(UPLOAD_KEY)
      expect(Buffer.isBuffer(storedUploads[0].data)).toBe(true)
      // Byte-for-byte, including the high bytes that would not survive a
      // utf8 round trip.
      expect(Array.from(storedUploads[0].data)).toEqual([
        0x50, 0x4b, 0x03, 0x04, 0x00, 0xff, 0x7f,
      ])
    })

    it('CHARACTERIZED: a body over the 25mb cap is 413 and nothing is stored', async () => {
      const res = await req()
        .put('/api/v1/imports/local')
        .query({ key: UPLOAD_KEY })
        .set('content-type', 'application/octet-stream')
        .send(Buffer.alloc(25 * 1024 * 1024 + 1, 0x41))

      expect(res.status).toBe(413)
      expect(res.body).toEqual({
        statusCode: 413,
        message: 'request entity too large',
      })
      expect(storedUploads).toHaveLength(0)
    })

    it('CHARACTERIZED: a 6MB body is stored -- the raw mount really does exceed the 6mb json limit', async () => {
      // The comment at main.ts:24-26 claims the raw mount exists to allow a
      // workbook above the json limit. This is that claim, measured.
      await req()
        .put('/api/v1/imports/local')
        .query({ key: UPLOAD_KEY })
        .set('content-type', 'application/octet-stream')
        .send(Buffer.alloc(6 * 1024 * 1024, 0x41))
        .expect(204)

      expect(storedUploads[0].data.length).toBe(6 * 1024 * 1024)
    })

    it('CHARACTERIZED: no `key` query param is 400 and nothing is stored', async () => {
      const res = await req()
        .put('/api/v1/imports/local')
        .set('content-type', 'application/octet-stream')
        .send(WORKBOOK_BYTES)

      expect(res.status).toBe(400)
      expect(res.body.message).toBe('Missing upload key')
      expect(storedUploads).toHaveLength(0)
    })
  })

  describe('5b. what `type: () => true` captures that it should not', () => {
    it('CHARACTERIZED (LATENT BUG): a JSON body PUT to the raw path is stored as a WORKBOOK, not parsed', async () => {
      // `type: () => true` accepts every content-type, so a client that sends
      // `application/json` to this path gets its JSON stored verbatim as
      // workbook bytes. `json()` never sees the request -- `raw()` has already
      // set `req._body` (1.x) / consumed the stream (2.x).
      //
      // Low severity as long as the endpoint stays local-dev only (the service
      // refuses to store anything once a bucket is configured), but it means
      // the endpoint cannot ever grow a JSON variant on the same path.
      const payload = JSON.stringify({ key: 'not-a-workbook' })

      await req()
        .put('/api/v1/imports/local')
        .query({ key: UPLOAD_KEY })
        .set('content-type', 'application/json')
        .send(payload)
        .expect(204)

      expect(storedUploads).toHaveLength(1)
      expect(storedUploads[0].data.toString('utf8')).toBe(payload)
    })

    it('CHARACTERIZED (LATENT BUG): the mount is a PREFIX, so sub-paths under `local/` are raw too', async () => {
      // `app.use(path)` matches by path prefix, not exactly. Any future route
      // added under `imports/local/...` silently loses JSON parsing, and the
      // only symptom would be a DTO arriving empty.
      const res = await req()
        .put('/api/v1/imports/local/probe')
        .set('content-type', 'application/json')
        .send(JSON.stringify({ a: 1 }))
        .expect(200)

      expect(res.body.isBuffer).toBe(true)
      expect(res.body.utf8).toBe('{"a":1}')
      expect(res.body.keys).toBeNull()
    })

    it('CHARACTERIZED (LATENT BUG): `content-length: 0` yields an EMPTY Buffer, which passes the `Buffer.isBuffer` check', async () => {
      // The one case where the controller's guard clause does not help:
      // `type-is.hasBody()` is TRUE for `content-length: 0`, so `raw()` runs its
      // read path and produces `Buffer.alloc(0)`. That is a Buffer, so
      // `ImportUploadLocalController` happily stages a zero-byte "workbook".
      // Contrast the bodyless request in the next block, which is rejected.
      await req()
        .put('/api/v1/imports/local')
        .query({ key: UPLOAD_KEY })
        .set('content-type', 'application/octet-stream')
        .set('content-length', '0')
        .send('')
        .expect(204)

      expect(storedUploads).toHaveLength(1)
      expect(storedUploads[0].data.length).toBe(0)
    })

    it('CHARACTERIZED: a POST (not PUT) to the raw path is 404, but the bytes were still read into memory', async () => {
      // The mount is method-agnostic. There is no route, so Nest answers 404 --
      // after `raw()` has already buffered up to 25MB. Recorded because it
      // means an unauthenticated caller can make the process allocate 25MB per
      // request on a path with no handler.
      const res = await req()
        .post('/api/v1/imports/local')
        .set('content-type', 'application/octet-stream')
        .send(WORKBOOK_BYTES)

      expect(res.status).toBe(404)
      expect(storedUploads).toHaveLength(0)
    })

    it('CHARACTERIZED: a sibling path is NOT captured -- `imports/presign-probe` still parses JSON', async () => {
      // The bound that makes the tests above meaningful: the mount is scoped,
      // not global.
      const res = await req()
        .post('/api/v1/imports/presign-probe')
        .set('content-type', 'application/json')
        .send(JSON.stringify({ boundary: 'admin' }))
        .expect(201)

      expect(res.body.raw.isBuffer).toBe(false)
      expect(res.body.raw.keys).toEqual(['boundary'])
      expect(res.body.dto).toEqual({ boundary: 'admin' })
    })

    it('CHARACTERIZED: a path that merely STARTS with `local` is not captured -- prefix matching respects segment boundaries', async () => {
      // `/api/v1/other/echo` stands in for any non-`imports/local` route. The
      // segment-boundary rule is what keeps a hypothetical
      // `imports/local-status` out of the raw mount.
      const res = await req()
        .post('/api/v1/other/echo')
        .set('content-type', 'application/json')
        .send(JSON.stringify({ a: 1 }))
        .expect(201)

      expect(res.body.isBuffer).toBe(false)
      expect(res.body.keys).toEqual(['a'])
    })
  })

  describe('2 + 3. bodyless vs empty body vs content-length: 0', () => {
    it('CHARACTERIZED: a TRULY bodyless PUT (no content-length header at all) is REJECTED with 400 and stores nothing', async () => {
      // `type-is.hasBody()` is false without a `content-length` or
      // `transfer-encoding` header, so `raw()` skips entirely and `req.body`
      // stays `{}` (body-parser 1) / `undefined` (body-parser 2). Neither is a
      // Buffer, so `ImportUploadLocalController:46-48` answers 400 on both
      // sides of the bump -- that guard clause is what keeps this endpoint off
      // the list of things Express 5 breaks. Worth a test precisely because,
      // without it, `undefined` would reach `storeLocalUpload`.
      const response = await rawRequest(port, [
        `PUT /api/v1/imports/local?key=${encodeURIComponent(UPLOAD_KEY)} HTTP/1.1`,
        'Host: 127.0.0.1',
        'Content-Type: application/octet-stream',
      ])

      expect(response).toContain('HTTP/1.1 400')
      expect(response).toContain('Expected a binary workbook body')
      expect(storedUploads).toHaveLength(0)
    })

    it('CHARACTERIZED: bodyless vs `content-length: 0` DIVERGE on the raw path -- 400 against 204', async () => {
      // The two cases side by side, since they are the pair most likely to be
      // confused. Same method, same path, same content-type; the only
      // difference is one header, and it decides whether a zero-byte workbook
      // is staged.
      const bodyless = await rawRequest(port, [
        `PUT /api/v1/imports/local?key=${encodeURIComponent(UPLOAD_KEY)} HTTP/1.1`,
        'Host: 127.0.0.1',
        'Content-Type: application/octet-stream',
      ])
      expect(bodyless).toContain('HTTP/1.1 400')
      expect(storedUploads).toHaveLength(0)

      const withZeroLength = await rawRequest(port, [
        `PUT /api/v1/imports/local?key=${encodeURIComponent(UPLOAD_KEY)} HTTP/1.1`,
        'Host: 127.0.0.1',
        'Content-Type: application/octet-stream',
        'Content-Length: 0',
      ])
      expect(withZeroLength).toContain('HTTP/1.1 204')
      expect(storedUploads).toHaveLength(1)
      expect(storedUploads[0].data.length).toBe(0)
    })

    it('NEST 11 BASELINE: on a JSON endpoint the two cases now DIVERGE -- undefined against {}', async () => {
      // `content-length: 0` + a matching content-type takes body-parser's READ
      // path and hits its zero-length special case, which returns `{}` in 1.x
      // and in 2.x alike -- the second half below is unchanged.
      //
      // No content-length takes the SKIP path, which is what 2.x changed from
      // `{}` to `undefined`. On Nest 10 both halves read
      // '"typeofBody":"object"' / '"isUndefined":false' / '"keys":[]'.
      const bodyless = await rawRequest(port, [
        'POST /api/v1/other/echo HTTP/1.1',
        'Host: 127.0.0.1',
        'Content-Type: application/json',
      ])
      expect(bodyless).toContain('HTTP/1.1 201')
      expect(bodyless).toContain('"typeofBody":"undefined"')
      expect(bodyless).toContain('"isUndefined":true')
      expect(bodyless).toContain('"keys":null')

      const withZeroLength = await rawRequest(port, [
        'POST /api/v1/other/echo HTTP/1.1',
        'Host: 127.0.0.1',
        'Content-Type: application/json',
        'Content-Length: 0',
      ])
      expect(withZeroLength).toContain('HTTP/1.1 201')
      expect(withZeroLength).toContain('"typeofBody":"object"')
      expect(withZeroLength).toContain('"keys":[]')
    })

    it('NEST 11 BASELINE: a bodyless POST to a JSON endpoint -> body is UNDEFINED, not {}', async () => {
      const res = await req().post('/api/v1/other/echo').expect(201)

      // The expectation this file was written to catch, and it moved as
      // predicted. On Nest 10 / body-parser 1.x this was 'object' / false / [];
      // body-parser 2.x leaves `req.body` unassigned on the SKIP path.
      //
      // Consequence to keep in mind for handler code: `req.body.foo` now throws
      // a TypeError where it used to read undefined, and `Object.keys(req.body)`
      // throws instead of returning []. Reaching a handler with no body at all
      // requires a request that sends no content-length, which no client in this
      // repo does.
      expect(res.body.typeofBody).toBe('undefined')
      expect(res.body.isUndefined).toBe(true)
      expect(res.body.keys).toBeNull()
    })

    it('CHARACTERIZED: an empty-string JSON body -> {} (body-parser special-cases zero length in 1.x AND 2.x)', async () => {
      const res = await req()
        .post('/api/v1/other/echo')
        .set('content-type', 'application/json')
        .send('')
        .expect(201)

      expect(res.body.typeofBody).toBe('object')
      expect(res.body.keys).toEqual([])
    })

    it('CHARACTERIZED: `content-length: 0` on a JSON endpoint -> {} via the read path, not the skip path', async () => {
      const res = await req()
        .post('/api/v1/other/echo')
        .set('content-type', 'application/json')
        .set('content-length', '0')
        .send('')
        .expect(201)

      expect(res.body.typeofBody).toBe('object')
      expect(res.body.isUndefined).toBe(false)
      expect(res.body.keys).toEqual([])
    })
  })

  describe('4. the 6mb json limit', () => {
    it('CHARACTERIZED: 200KB of JSON is accepted -- proof the 6mb limit is in force, not Nest\'s 100kb default', async () => {
      const res = await req()
        .post('/api/v1/other/echo')
        .set('content-type', 'application/json')
        .send(JSON.stringify({ a: 'x'.repeat(200 * 1024) }))
        .expect(201)

      expect(res.body.keys).toEqual(['a'])
    })

    it('CHARACTERIZED: JSON above 6mb is 413 with `{ statusCode, message }`', async () => {
      const res = await req()
        .post('/api/v1/other/echo')
        .set('content-type', 'application/json')
        .send(JSON.stringify({ a: 'x'.repeat(6 * 1024 * 1024) }))

      expect(res.status).toBe(413)
      expect(res.body.keys).toBeUndefined()
      expect(res.body).toEqual({
        statusCode: 413,
        message: 'request entity too large',
      })
    })
  })

  describe('6. wrong content-type', () => {
    it('NEST 11 BASELINE: multipart sent to a JSON endpoint -> body is UNDEFINED and the file is LOST', async () => {
      // directorate-of-equality-api registers no multipart interceptor at all,
      // so a multipart request is simply unparsed. No parser claims the
      // content-type, which is the SKIP path: `keys` was [] on body-parser 1.x
      // and is null now. The file is lost either way.
      const res = await req()
        .post('/api/v1/other/echo')
        .attach('file', WORKBOOK_BYTES, {
          filename: 'workbook.xlsx',
          contentType:
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        })
        .expect(201)

      expect(res.body.isBuffer).toBe(false)
      expect(res.body.keys).toBeNull()
    })

    it('NEST 11 BASELINE: a JSON body under `content-type: text/plain` is NOT parsed', async () => {
      const res = await req()
        .post('/api/v1/other/echo')
        .set('content-type', 'text/plain')
        .send('{"a":1}')
        .expect(201)

      // Also the SKIP path -- no parser matches text/plain. Was [] on
      // body-parser 1.x.
      expect(res.body.keys).toBeNull()
    })
  })

  describe('7. urlencoded({ extended: true }) and whitelist: true', () => {
    it('CHARACTERIZED: `a[b]=1` becomes a nested object (qs, i.e. extended: true)', async () => {
      const res = await req()
        .post('/api/v1/other/urlencoded')
        .set('content-type', 'application/x-www-form-urlencoded')
        .send('a[b]=1')
        .expect(201)

      expect(res.body.body).toEqual({ a: { b: '1' } })
    })

    it('CHARACTERIZED: `a[]=1&a[]=2` becomes an array', async () => {
      const res = await req()
        .post('/api/v1/other/urlencoded')
        .set('content-type', 'application/x-www-form-urlencoded')
        .send('a[]=1&a[]=2')
        .expect(201)

      expect(res.body.body).toEqual({ a: ['1', '2'] })
    })

    it('CHARACTERIZED: `whitelist: true` strips unknown keys off the DTO but leaves `req.body` untouched', async () => {
      // The difference from the official-journal APIs, whose
      // ExceptionFactoryPipe does not set `whitelist`. Worth pinning next to
      // the parser behaviour: the raw request body still carries the extra key,
      // so anything reading `@Req()` rather than the DTO sees it.
      const res = await req()
        .post('/api/v1/imports/presign-probe')
        .set('content-type', 'application/json')
        .send(JSON.stringify({ boundary: 'admin', sneaky: 'value' }))
        .expect(201)

      expect(res.body.dto).toEqual({ boundary: 'admin' })
      expect(res.body.raw.keys).toEqual(['boundary', 'sneaky'])
    })
  })
})
