import { readFileSync } from 'fs'
import { join } from 'path'

import { INestApplication } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'

import { describeOpenApiDrift } from '@dmr.is/utils-shared/openapi/drift'

import { applyApiRouting } from '../../api-routing'
import { AppModule } from '../../app/app.module'
import { buildSwaggerDocument } from '../../setupSwaggerDocument'
import { SWAGGER_CONFIG } from '../../swagger.config'

/**
 * Fails when directorate-of-equality-web's committed `clientConfig.json` no longer matches the
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
const REPO_ROOT = join(__dirname, '../../../../..')
const SWAGGER_PATH = 'swagger/internal'
const CLIENT_CONFIG = 'apps/directorate-of-equality-web/clientConfig.json'
const FIX =
  'yarn nx run directorate-of-equality-web:update-openapi-schema (against a running API), then codegen'

describe('Generated client config', () => {
  let app: INestApplication

  beforeAll(async () => {
    // Same harness as swagger-coverage.spec.ts: the real AppModule, routed by
    // the function main.ts calls, previewed without connecting to anything.
    app = await NestFactory.create(AppModule, { preview: true, logger: false })
    applyApiRouting(app)
  }, 120000)

  afterAll(async () => {
    await app?.close()
  })

  it(`${SWAGGER_PATH} matches ${CLIENT_CONFIG}`, () => {
    const config = SWAGGER_CONFIG.find((c) => c.swaggerPath === SWAGGER_PATH)
    if (!config) throw new Error(`No SWAGGER_CONFIG entry "${SWAGGER_PATH}"`)

    const drift = describeOpenApiDrift(
      buildSwaggerDocument(app, config),
      JSON.parse(readFileSync(join(REPO_ROOT, CLIENT_CONFIG), 'utf8')),
    )
    if (drift.length > 0) {
      throw new Error(
        `${CLIENT_CONFIG} has drifted from ${SWAGGER_PATH}:\n  ${drift.join('\n  ')}\nRegenerate it: ${FIX}`,
      )
    }
  })
})
