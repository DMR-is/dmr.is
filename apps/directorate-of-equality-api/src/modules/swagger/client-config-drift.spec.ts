/* eslint-disable @typescript-eslint/no-explicit-any -- walks untyped OpenAPI JSON */
import { readFileSync } from 'fs'
import { join } from 'path'

import { INestApplication } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'

import { applyApiRouting } from '../../api-routing'
import { AppModule } from '../../app/app.module'
import { buildSwaggerDocument } from '../../setupSwaggerDocument'
import { SWAGGER_CONFIG } from '../../swagger.config'

/**
 * Fails when directorate-of-equality-web's committed `clientConfig.json` no
 * longer matches the internal schema this API serves - i.e. a route or DTO
 * changed and the client was not regenerated. Drift means the web silently
 * calls routes that changed shape, or misses new ones.
 *
 * `clientConfig.json` is the baseline on purpose: it is the wire format
 * `openapi-ts` consumes, and #1405 removed a separate snapshot copy for being
 * less faithful. Fix drift with
 * `yarn nx run directorate-of-equality-web:update-openapi-schema` against a
 * running API, then `codegen`.
 */
const REPO_ROOT = join(__dirname, '../../../../..')
const SWAGGER_PATH = 'swagger/internal'
const CLIENT_CONFIG = 'apps/directorate-of-equality-web/clientConfig.json'

/**
 * The schema as it goes over the wire: `JSON.stringify` drops in-memory
 * `undefined` keys, and neither parameter order nor key order is semantic
 * (ts-jest's emit can reorder reflected parameters depending on cache state,
 * see #1405).
 */
const toWire = (doc: unknown): Record<string, any> => {
  const wire = JSON.parse(JSON.stringify(doc))
  for (const ops of Object.values<Record<string, any>>(wire.paths ?? {})) {
    for (const op of Object.values<any>(ops)) {
      op.parameters?.sort((a: any, b: any) =>
        `${a.in}:${a.name}`.localeCompare(`${b.in}:${b.name}`),
      )
    }
  }
  return wire
}

/** Deep equality that ignores object key order (also not semantic). */
const canonical = (value: unknown): unknown =>
  Array.isArray(value)
    ? value.map(canonical)
    : value && typeof value === 'object'
      ? Object.fromEntries(
          Object.keys(value)
            .sort()
            .map((k) => [k, canonical((value as Record<string, unknown>)[k])]),
        )
      : value

const same = (a: unknown, b: unknown) =>
  JSON.stringify(canonical(a)) === JSON.stringify(canonical(b))

/** Human-readable differences, one line per operation or schema. */
const describeDrift = (served: unknown, committedPath: string): string[] => {
  const live = toWire(served)
  const committed = toWire(
    JSON.parse(readFileSync(join(REPO_ROOT, committedPath), 'utf8')),
  )
  const drift: string[] = []
  const ops = (doc: Record<string, any>) =>
    new Map(
      Object.entries<Record<string, any>>(doc.paths ?? {}).flatMap(
        ([path, methods]) =>
          Object.entries<any>(methods).map(([method, op]) => [
            `${method.toUpperCase()} ${path} (${op.operationId})`,
            op,
          ]),
      ),
    )
  const [liveOps, committedOps] = [ops(live), ops(committed)]
  for (const [key, op] of liveOps) {
    if (!committedOps.has(key)) drift.push(`+ operation ${key}`)
    else if (!same(op, committedOps.get(key))) drift.push(`~ operation ${key}`)
  }
  for (const key of committedOps.keys())
    if (!liveOps.has(key)) drift.push(`- operation ${key}`)

  const liveSchemas = live.components?.schemas ?? {}
  const committedSchemas = committed.components?.schemas ?? {}
  for (const name of new Set([
    ...Object.keys(liveSchemas),
    ...Object.keys(committedSchemas),
  ])) {
    if (!(name in committedSchemas)) drift.push(`+ schema ${name}`)
    else if (!(name in liveSchemas)) drift.push(`- schema ${name}`)
    else if (!same(liveSchemas[name], committedSchemas[name]))
      drift.push(`~ schema ${name}`)
  }

  const { paths: _a, components: _b, ...liveRest } = live
  const { paths: _c, components: _d, ...committedRest } = committed
  if (!same(liveRest, committedRest)) drift.push('~ document metadata')

  return drift
}

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

    expect(
      describeDrift(buildSwaggerDocument(app, config), CLIENT_CONFIG),
    ).toEqual([])
  })
})
