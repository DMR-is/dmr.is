import { readFileSync } from 'fs'
import { join } from 'path'
import { Sequelize } from 'sequelize-typescript'

import { NestApplication } from '@nestjs/core'
import { Test } from '@nestjs/testing'

import { describeOpenApiDrift } from '@dmr.is/utils-shared/openapi/drift'

import { AppModule } from './app/app.module'
import { applyApiRouting } from './api-routing'
import { buildSwaggerDocument } from './setupSwaggerDocument'

/**
 * Fails when official-journal-web's committed `clientConfig.json` no longer matches the
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
const REPO_ROOT = join(__dirname, '../../..')
const CLIENT_CONFIG = 'apps/official-journal-web/clientConfig.json'
const FIX =
  'yarn nx run official-journal-web:update-schema (against a running admin API)'

describe('Generated client config', () => {
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

  it(`matches ${CLIENT_CONFIG}`, () => {
    const drift = describeOpenApiDrift(
      buildSwaggerDocument(app),
      JSON.parse(readFileSync(join(REPO_ROOT, CLIENT_CONFIG), 'utf8')),
    )
    if (drift.length > 0) {
      throw new Error(
        `${CLIENT_CONFIG} has drifted from the served schema:\n  ${drift.join('\n  ')}\nRegenerate it: ${FIX}`,
      )
    }
  })
})
