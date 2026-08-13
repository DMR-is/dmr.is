/**
 * Which `forRoutes(...)` path spellings actually mount middleware.
 *
 * WHY THIS EXISTS
 * Express 5 (shipped by Nest 11's `@nestjs/platform-express`) replaces
 * path-to-regexp 0.1.x with 8.x, which drops unnamed wildcards. The obvious
 * pre-flight move -- rewrite every `forRoutes('*')` to the Express 5 spelling
 * `'{*splat}'` before the bump -- is a trap: under path-to-regexp 0.1.x braces
 * are ordinary literal characters, so `'{*splat}'` mounts the middleware on a
 * path no request can ever have. Nothing fails. The app boots, every route
 * answers, and CLS context plus request logging are simply gone.
 *
 * `libs/shared/middleware` holds the two middlewares mounted this way --
 * `cls.middleware.ts` and `log-request.middleware.ts` -- so a silent non-match
 * costs every request its correlation id and its access-log line.
 *
 * MEASURED, not reasoned about. Every expectation below was produced by running
 * this file. The Express 5 column in the table was produced the same way, in a
 * throwaway project on @nestjs/core 11.1.29 / express 5.2.1 / path-to-regexp
 * 8.4.2, because it cannot be executed from inside this repo yet.
 *
 *   forRoutes spelling            Express 4 / Nest 10    Express 5 / Nest 11
 *   ---------------------------   --------------------   -------------------
 *   '*'                          mounts                 mounts
 *   { path: '*', method: ALL }    mounts                 mounts
 *   '{*splat}'                    MOUNTS NOTHING         mounts
 *   '*splat'                      MOUNTS NOTHING         mounts
 *   '/**'                         mounts                 BOOT FAILURE
 *
 * `'*'` survives the bump because Nest 11's `LegacyRouteConverter` rewrites it
 * to `'{*path}'` before handing it to path-to-regexp, and deliberately skips
 * the deprecation warning for the bare catch-all. So the correct pre-flight
 * action for the five `forRoutes('*')` sites is to leave them alone.
 *
 * `'/**'` is the opposite case: it works today and throws
 * `PathError: Missing parameter name at index 2` at boot on Express 5. Nest 11's
 * converter does not recognise it. This app was the only site using it.
 */
import type { NextFunction, Request, Response } from 'express'
import { Sequelize } from 'sequelize-typescript'
import request from 'supertest'

import type { INestApplication, MiddlewareConsumer } from '@nestjs/common'
import {
  Controller,
  Get,
  Injectable,
  Module,
  NestMiddleware,
  RequestMethod,
  VersioningType,
} from '@nestjs/common'
import type { RouteInfo } from '@nestjs/common/interfaces'
import { Test } from '@nestjs/testing'

import { LogRequestMiddleware } from '@dmr.is/shared-middleware'

import { AppModule } from './app/app.module'

const hits: Array<string> = []

@Injectable()
class ProbeMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    hits.push(req.originalUrl)
    next()
  }
}

@Controller({ version: '1' })
class ProbeController {
  @Get('probe')
  probe() {
    return { ok: true }
  }
}

/**
 * Boots a throwaway app with the same global prefix and URI versioning
 * `src/main.ts` sets, mounting `ProbeMiddleware` on the given path spelling.
 */
const mountOn = async (
  route: string | RouteInfo,
): Promise<INestApplication> => {
  @Module({ controllers: [ProbeController], providers: [ProbeMiddleware] })
  class ProbeModule {
    configure(consumer: MiddlewareConsumer) {
      consumer.apply(ProbeMiddleware).forRoutes(route)
    }
  }

  const moduleRef = await Test.createTestingModule({
    imports: [ProbeModule],
  }).compile()

  const app = moduleRef.createNestApplication()
  app.setGlobalPrefix('api')
  app.enableVersioning({ type: VersioningType.URI })
  await app.init()
  return app
}

const hitCountFor = async (
  route: string | RouteInfo,
  url: string,
): Promise<number> => {
  const app = await mountOn(route)
  try {
    hits.length = 0
    await request(app.getHttpServer()).get(url)
    return hits.length
  } finally {
    await app.close()
  }
}

describe('forRoutes wildcard spellings on the installed Express', () => {
  it('CHARACTERIZED: the installed Express is 4.x (path-to-regexp 0.1.x)', async () => {
    // The canary for this whole file. Express 4 defaults `query parser` to
    // `extended`, Express 5 to `simple` -- the same canary
    // `apps/official-journal-admin-api/src/query-string-parsing.spec.ts` uses.
    // When it fails, the bump has happened and the two MOUNTS-NOTHING
    // expectations below are expected to flip to 1.
    const app = await mountOn('*')
    try {
      const expressInstance = app.getHttpAdapter().getInstance()
      expect(expressInstance.get('query parser')).toBe('extended')
    } finally {
      await app.close()
    }
  })

  it('SPECIFIED: `*` mounts the middleware -- the only spelling valid on both Express 4 and 5', async () => {
    await expect(hitCountFor('*', '/api/v1/probe')).resolves.toBe(1)
  })

  it('SPECIFIED: `{ path: "*", method: ALL }` mounts the middleware', async () => {
    await expect(
      hitCountFor({ path: '*', method: RequestMethod.ALL }, '/api/v1/probe'),
    ).resolves.toBe(1)
  })

  it('CHARACTERIZED: `{*splat}` -- the Express 5 spelling -- mounts NOTHING here', async () => {
    // This is the silent regression. The request still succeeds; the
    // middleware simply never runs. Do not adopt this spelling before the bump.
    await expect(hitCountFor('{*splat}', '/api/v1/probe')).resolves.toBe(0)
  })

  it('CHARACTERIZED: `*splat` mounts NOTHING here either', async () => {
    await expect(hitCountFor('*splat', '/api/v1/probe')).resolves.toBe(0)
  })

  it('CHARACTERIZED: `/**` mounts the middleware here but is a boot failure on Express 5', async () => {
    await expect(hitCountFor('/**', '/api/v1/probe')).resolves.toBe(1)
  })

  it('SPECIFIED: `*` also mounts on paths that match no route', async () => {
    // Middleware runs before routing, so the 404 path is covered too. The
    // AppModule assertion below relies on this.
    await expect(hitCountFor('*', '/api/v1/no-such-route')).resolves.toBe(1)
  })
})

describe('the real official-journal-application-api AppModule', () => {
  let app: INestApplication
  let use: jest.SpyInstance

  beforeAll(async () => {
    use = jest
      .spyOn(LogRequestMiddleware.prototype, 'use')
      .mockImplementation((_req, _res, next) => next())

    const module = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(Sequelize)
      .useValue({ repositoryMode: false, close: () => Promise.resolve() })
      .compile()

    app = module.createNestApplication()
    app.setGlobalPrefix('api')
    app.enableVersioning({ type: VersioningType.URI })
    await app.init()
  }, 120000)

  afterAll(async () => {
    use?.mockRestore()
    await app?.close()
  })

  it('SPECIFIED: LogRequestMiddleware actually runs for an incoming request', async () => {
    // The assertion the `{*splat}` trap would defeat: with a spelling that
    // matches nothing this stays at 0 while every other test in the repo keeps
    // passing.
    use.mockClear()

    await request(app.getHttpServer()).get('/api/v1/no-such-route')

    expect(use).toHaveBeenCalledTimes(1)
  }, 30000)
})
