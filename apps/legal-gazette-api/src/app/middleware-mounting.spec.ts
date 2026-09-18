/**
 * Proves the global middleware this app mounts is actually reached by a request.
 *
 * `AppModule.configure` mounts `CLSMiddleware` and then `LogRequestMiddleware`,
 * both with `forRoutes('*')`. The Express 5 spelling of that catch-all is
 * `'{*splat}'`, and adopting it before the Nest 11 bump silently mounts both on
 * a path no request can have: the app boots, every route answers, and every
 * request loses its transaction namespace and its access-log line without a
 * single test failing. See
 * `apps/official-journal-application-api/src/middleware-wildcard-routes.spec.ts`
 * for the measured matrix of which spellings mount under which Express.
 *
 * `CLSMiddleware` opens the Sequelize transaction that the request-scoped
 * repositories rely on, so a silent non-match here is a correctness failure and
 * not only a lost log line.
 */
import { Sequelize } from 'sequelize-typescript'
import request from 'supertest'

import type { INestApplication } from '@nestjs/common'
import { VersioningType } from '@nestjs/common'
import { Test } from '@nestjs/testing'

import { CLSMiddleware, LogRequestMiddleware } from '@dmr.is/shared-middleware'

import { AppModule } from './app.module'

describe('global middleware mounting', () => {
  let app: INestApplication
  let cls: jest.SpyInstance
  let logRequest: jest.SpyInstance
  const order: Array<string> = []

  beforeAll(async () => {
    // Both are stubbed: CLSMiddleware would otherwise open a real transaction
    // against the stubbed Sequelize. What is under test is whether Express
    // calls them at all.
    cls = jest
      .spyOn(CLSMiddleware.prototype, 'use')
      .mockImplementation(async (_req, _res, next) => {
        order.push('cls')
        next()
      })
    logRequest = jest
      .spyOn(LogRequestMiddleware.prototype, 'use')
      .mockImplementation((_req, _res, next) => {
        order.push('log-request')
        next()
      })

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
    cls?.mockRestore()
    logRequest?.mockRestore()
    await app?.close()
  })

  it('SPECIFIED: both middlewares run, in registration order', async () => {
    // An unrouted path on purpose: middleware runs before routing, so this
    // needs no database, no auth token and no real handler.
    order.length = 0
    cls.mockClear()
    logRequest.mockClear()

    await request(app.getHttpServer()).get('/api/v1/no-such-route')

    expect(cls).toHaveBeenCalledTimes(1)
    expect(logRequest).toHaveBeenCalledTimes(1)
    expect(order).toEqual(['cls', 'log-request'])
  }, 30000)
})
