import { Sequelize } from 'sequelize-typescript'

import { VersioningType } from '@nestjs/common'
import { NestApplication } from '@nestjs/core'
import { SwaggerModule } from '@nestjs/swagger'
import { Test } from '@nestjs/testing'

import { openApi } from '../openApi'
import { AppModule } from './app.module'

/**
 * Guards the emitted OpenAPI document: five web apps consume clients generated
 * from it, so any unintended change to the schema is a breaking change for them.
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
    await app.close()
  })

  it('emits an unchanged OpenAPI schema', () => {
    const document = SwaggerModule.createDocument(app, openApi, {
      autoTagControllers: false,
    })

    expect(Object.keys(document.paths).length).toBeGreaterThan(0)
    expect(document).toMatchSnapshot()
  })
})
