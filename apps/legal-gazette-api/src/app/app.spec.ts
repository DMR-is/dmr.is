import { Sequelize } from 'sequelize-typescript'

import { NestApplication } from '@nestjs/core'
import { Test } from '@nestjs/testing'

import { applyApiRouting } from '../api-routing'
import { buildSwaggerDocument } from '../setupSwaggerDocument'
import { SWAGGER_CONFIG } from '../swagger.config'
import { AppModule } from './app.module'

/**
 * Smoke test: the real AppModule compiles and Swagger emits a document with
 * routes in it. This is what catches a module that no longer boots.
 *
 * Schema drift is not gated here: client-config-drift.spec.ts compares the
 * served document with each web's committed clientConfig.json.
 *
 * The documents are built from the real AppModule through the same
 * `buildSwaggerDocument` production uses, routed by the same `applyApiRouting`
 * as main.ts. Only the Sequelize connection is stubbed -- Swagger needs
 * route metadata, not a live database.
 */
describe('Swagger documentation', () => {
  let app: NestApplication

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(Sequelize)
      .useValue({ repositoryMode: false, close: () => Promise.resolve() })
      .compile()

    app = module.createNestApplication()
    applyApiRouting(app)
  }, 60000)

  afterAll(async () => {
    // Guarded: if `compile()` above threw, `app` was never assigned, and an
    // unguarded `app.close()` raises a TypeError that replaces the real boot
    // error in the output.
    await app?.close()
  })

  it.each(
    SWAGGER_CONFIG.map((config) => [config.swaggerPath, config] as const),
  )('builds a non-empty OpenAPI document for %s', (_swaggerPath, config) => {
    const document = buildSwaggerDocument(app, config)

    expect(Object.keys(document.paths).length).toBeGreaterThan(0)
  })
})
