import { Sequelize } from 'sequelize-typescript'

import { VersioningType } from '@nestjs/common'
import { NestApplication } from '@nestjs/core'
import { SwaggerModule } from '@nestjs/swagger'
import { Test } from '@nestjs/testing'

import { openApi } from '../openApi'
import { AppModule } from './app.module'

/**
 * Smoke test: the real AppModule compiles and Swagger emits a document with
 * routes in it. This is what catches a module that no longer boots.
 *
 * Schema DRIFT is not gated here -- the committed clientConfig.json per web app
 * is the schema baseline, and it is the wire format the generators actually
 * consume. See PR #1405 for why the snapshot gate was removed.
 *
 * The document is built from the real AppModule with the same DocumentBuilder
 * config, global prefix and versioning main.ts uses. Only the Sequelize
 * connection is stubbed -- Swagger needs route metadata, not a live database.
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

  it('builds a non-empty OpenAPI document', () => {
    const document = SwaggerModule.createDocument(app, openApi, {
      autoTagControllers: false,
    })

    expect(Object.keys(document.paths).length).toBeGreaterThan(0)
  })

  // `CurrentApplication` is not a `@Param`, so Swagger infers nothing from it;
  // routes that use it declare `id` with `@ApiParam`. Every operation under a
  // path with an `{id}` segment must declare it, so a new guarded route
  // without `@ApiParam` fails here.
  it('declares the id path parameter on every route with an {id} segment', () => {
    const document = SwaggerModule.createDocument(app, openApi, {
      autoTagControllers: false,
    })
    const idPaths = Object.entries(document.paths).filter(([path]) =>
      path.includes('{id}'),
    )

    expect(idPaths.length).toBeGreaterThan(0)
    for (const [path, item] of idPaths) {
      for (const [method, operation] of Object.entries(item)) {
        const parameters = (operation as { parameters?: unknown[] }).parameters
        expect({ path, method, parameters }).toEqual({
          path,
          method,
          parameters: expect.arrayContaining([
            expect.objectContaining({ name: 'id', in: 'path', required: true }),
          ]),
        })
      }
    }
  })
})
