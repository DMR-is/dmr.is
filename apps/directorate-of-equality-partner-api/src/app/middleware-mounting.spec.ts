/**
 * Proves the global middleware this app mounts is actually reached by a request.
 *
 * `AppModule.configure` mounts `CLSMiddleware` and then `LogRequestMiddleware`,
 * both with `forRoutes('*')`. A catch-all that stops matching mounts them on a
 * path no request can have: the app boots, every route answers, and every
 * request loses its transaction namespace and its access-log line without a
 * single test failing. `middleware-wildcard-routes.spec.ts` in
 * official-journal-application-api has the measured matrix of which spellings
 * mount under which Express.
 *
 * Checked rather than assumed: on the Express in this tree (5.2.1) both `'*'`
 * and the Express 5 `'{*splat}'` mount, so swapping them is not what this test
 * catches. What it catches is a pattern that matches nothing — verified by
 * pointing `forRoutes` at a literal path, which fails this spec.
 *
 * Both sibling APIs pin this; the partner API did not, and it is the one that
 * needs it most. `ScoringModelService` deliberately carries **no**
 * `sequelize.transaction()` of its own — a wrapper there does not nest under
 * CLS, so it opens a second connection whose writes survive the rollback
 * `CLSMiddleware` performs on a non-2xx. The replace-whole writes are atomic
 * only because this middleware runs, so a silent non-match here would not merely
 * lose a log line: it would leave `setSteps` and `setRoleStepAssignments`
 * committing a destroy and a bulkCreate independently, with no test failing.
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
    // needs no database, no API key and no real handler.
    order.length = 0
    cls.mockClear()
    logRequest.mockClear()

    await request(app.getHttpServer()).get('/api/v1/no-such-route')

    expect(cls).toHaveBeenCalledTimes(1)
    expect(logRequest).toHaveBeenCalledTimes(1)
    expect(order).toEqual(['cls', 'log-request'])
  }, 30000)
})
