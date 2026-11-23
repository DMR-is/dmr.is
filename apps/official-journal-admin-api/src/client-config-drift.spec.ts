/* eslint-disable @typescript-eslint/no-explicit-any -- walks untyped OpenAPI JSON */
import { readFileSync } from 'fs'
import { join } from 'path'
import { Sequelize } from 'sequelize-typescript'

import { VersioningType } from '@nestjs/common'
import { NestApplication } from '@nestjs/core'
import { Test } from '@nestjs/testing'

import { AppModule } from './app/app.module'
import { buildSwaggerDocument } from './swagger-document'

/**
 * Fails when official-journal-web's committed `clientConfig.json` no longer
 * matches the schema this API serves - i.e. a route or DTO changed and the
 * client was not regenerated. Drift means the web silently calls routes that
 * changed shape, or (for a route that became secured) sends no bearer token.
 *
 * `clientConfig.json` is the baseline on purpose: it is the wire format the
 * generator consumes, and #1405 removed a separate snapshot copy for being
 * less faithful. Fix drift with `yarn nx run official-journal-web:update-schema`
 * against a running admin API.
 *
 * The web configs are inputs of this project's test target, so a cached pass
 * is not replayed after a config changes. They are not implicit dependencies,
 * though: a PR that edits only a web's clientConfig.json does not mark this API
 * affected, and the gate first runs on the next PR that touches the API.
 */
const REPO_ROOT = join(__dirname, '../../..')
const CLIENT_CONFIG = 'apps/official-journal-web/clientConfig.json'

/**
 * The schema as it goes over the wire: `JSON.stringify` drops in-memory
 * `undefined` keys, and neither parameter order nor key order is semantic
 * (the test transform's emit can reorder reflected parameters, see #1405).
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

  // Everything outside paths and schemas: info, servers, tags, and the rest
  // of components - notably securitySchemes, which decides how the generated
  // client attaches credentials.
  const { schemas: _a, ...liveComponents } = live.components ?? {}
  const { schemas: _b, ...committedComponents } = committed.components ?? {}
  if (!same(liveComponents, committedComponents))
    drift.push('~ components (other than schemas)')
  const { paths: _c, components: _d, ...liveRest } = live
  const { paths: _e, components: _f, ...committedRest } = committed
  if (!same(liveRest, committedRest)) drift.push('~ document metadata')

  return drift
}

describe('Generated client config', () => {
  let app: NestApplication

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(Sequelize)
      .useValue({ repositoryMode: false, close: () => Promise.resolve() })
      .compile()

    app = module.createNestApplication()
    app.setGlobalPrefix('api')
    app.enableVersioning({ type: VersioningType.URI })
  }, 60000)

  afterAll(async () => {
    await app?.close()
  })

  it(`matches ${CLIENT_CONFIG}`, () => {
    expect(describeDrift(buildSwaggerDocument(app), CLIENT_CONFIG)).toEqual([])
  })
})
