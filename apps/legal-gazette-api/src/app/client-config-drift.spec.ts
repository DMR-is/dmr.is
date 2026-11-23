import { readFileSync } from 'fs'
import { join } from 'path'
import { Sequelize } from 'sequelize-typescript'

import { NestApplication } from '@nestjs/core'
import { Test } from '@nestjs/testing'

import { describeOpenApiDrift } from '@dmr.is/utils-shared/openapi/drift'

import { applyApiRouting } from '../api-routing'
import { buildSwaggerDocument } from '../setupSwaggerDocument'
import { SWAGGER_CONFIG } from '../swagger.config'
import { AppModule } from './app.module'

/**
 * Fails when a Legal Gazette web's committed `clientConfig.json` no longer matches the
 * schema this API serves, i.e. a route or DTO changed and the client was not
 * regenerated. The generated clients are built from those files, so drift
 * means a web calls routes that changed shape, misses new ones, or (for a
 * route that became secured) sends no bearer token.
 *
 * The committed `clientConfig.json` is the baseline on purpose: it is the wire
 * format the generator consumes, and #1405 removed a separate snapshot copy
 * for being less faithful. The comparison itself is `describeOpenApiDrift`.
 *
 * The configs are inputs of this project's test target, so a cached pass is
 * not replayed after one changes. They are not implicit dependencies: a PR that
 * edits only a web's clientConfig.json does not mark this API affected.
 */
const REPO_ROOT = join(__dirname, '../../../..')
const FIX = 'yarn lg:update-clients (against a running legal-gazette-api)'

const CLIENTS: Record<string, string> = {
  swagger: 'apps/legal-gazette-web/clientConfig.json',
  'application-web-swagger':
    'apps/legal-gazette-application-web/clientConfig.json',
  'public-swagger': 'apps/legal-gazette-public-web/clientConfig.json',
}

describe('Generated client configs', () => {
  let app: NestApplication

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(Sequelize)
      .useValue({ repositoryMode: false, close: () => Promise.resolve() })
      .compile()

    app = module.createNestApplication()
    applyApiRouting(app)
  }, 60000)

  afterAll(async () => {
    await app?.close()
  })

  it.each(Object.entries(CLIENTS))(
    '%s matches %s',
    (swaggerPath, clientConfig) => {
      const config = SWAGGER_CONFIG.find((c) => c.swaggerPath === swaggerPath)
      if (!config) throw new Error(`No SWAGGER_CONFIG entry "${swaggerPath}"`)

      const drift = describeOpenApiDrift(
        buildSwaggerDocument(app, config),
        JSON.parse(readFileSync(join(REPO_ROOT, clientConfig), 'utf8')),
      )
      if (drift.length > 0) {
        throw new Error(
          `${clientConfig} has drifted from ${swaggerPath}:\n  ${drift.join('\n  ')}\nRegenerate it: ${FIX}`,
        )
      }
    },
  )
})
