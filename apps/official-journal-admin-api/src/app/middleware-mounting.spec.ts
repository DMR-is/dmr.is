/**
 * Proves the global middleware this app mounts is actually reached by a request.
 *
 * `AppModule.configure` mounts `LogRequestMiddleware` with
 * `forRoutes({ path: "*", method: RequestMethod.ALL })`.
 * The Express 5 spelling of that catch-all is `'{*splat}'`, and adopting it
 * before the Nest 11 bump silently mounts the middleware on a path no request
 * can have: the app boots, every route answers, and every request loses its
 * access-log line without a single test failing. See
 * `apps/official-journal-application-api/src/middleware-wildcard-routes.spec.ts`
 * for the measured matrix of which spellings mount under which Express.
 *
 * This is the test that fails in that scenario.
 */
import { Sequelize } from 'sequelize-typescript'
import request from 'supertest'

import type { INestApplication } from '@nestjs/common'
import { VersioningType } from '@nestjs/common'
import { Test } from '@nestjs/testing'

import { LogRequestMiddleware } from '@dmr.is/shared-middleware'

import { AppModule } from './app.module'

describe('global middleware mounting', () => {
  let app: INestApplication
  let logRequest: jest.SpyInstance

  beforeAll(async () => {
    logRequest = jest
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
    logRequest?.mockRestore()
    await app?.close()
  })

  it('SPECIFIED: LogRequestMiddleware runs for an incoming request', async () => {
    // An unrouted path on purpose: middleware runs before routing, so this
    // needs no database, no auth token and no real handler.
    logRequest.mockClear()

    await request(app.getHttpServer()).get('/api/v1/no-such-route')

    expect(logRequest).toHaveBeenCalledTimes(1)
  }, 30000)
})
