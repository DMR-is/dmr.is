import { Sequelize } from 'sequelize-typescript'

import { VersioningType } from '@nestjs/common'
import { NestApplication } from '@nestjs/core'
import { Test } from '@nestjs/testing'

import { sortOpenApiParameters } from '@dmr.is/utils-shared/openapi/sort-parameters'

import { buildSwaggerDocument } from '../setupSwaggerDocument'
import { SWAGGER_CONFIG } from '../swagger.config'
import { AppModule } from './app.module'

/**
 * Guards the emitted OpenAPI documents: the Legal Gazette web apps consume
 * clients generated from them, so any unintended change to a schema is a
 * breaking change for them.
 *
 * The documents are built from the real AppModule through the same
 * `buildSwaggerDocument` production uses, with the global prefix and versioning
 * main.ts applies. Only the Sequelize connection is stubbed -- Swagger needs
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
    app.setGlobalPrefix('api')
    app.enableVersioning({ type: VersioningType.URI })
  }, 60000)

  afterAll(async () => {
    // Guarded: if `compile()` above threw, `app` was never assigned, and an
    // unguarded `app.close()` raises a TypeError that replaces the real boot
    // error in the output.
    await app?.close()
  })

  it.each(
    SWAGGER_CONFIG.map((config) => [config.swaggerPath, config] as const),
  )('emits an unchanged OpenAPI schema for %s', (_swaggerPath, config) => {
    const document = buildSwaggerDocument(app, config)

    expect(Object.keys(document.paths).length).toBeGreaterThan(0)
    expect(sortOpenApiParameters(document)).toMatchSnapshot()
  })
})
