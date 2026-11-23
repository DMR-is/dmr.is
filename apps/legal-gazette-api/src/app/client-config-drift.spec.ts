/* eslint-disable @typescript-eslint/no-explicit-any -- walks untyped OpenAPI JSON */
import { readFileSync } from 'fs'
import { join } from 'path'
import { Sequelize } from 'sequelize-typescript'

import { VersioningType } from '@nestjs/common'
import { NestApplication } from '@nestjs/core'
import { Test } from '@nestjs/testing'

import { buildSwaggerDocument } from '../setupSwaggerDocument'
import { SWAGGER_CONFIG } from '../swagger.config'
import { AppModule } from './app.module'

/**
 * Fails when a web app's committed `clientConfig.json` no longer matches the
 * schema this API serves - i.e. someone changed a route or DTO and did not
 * regenerate the client. The generated clients are built from those files, so
 * drift means the web silently calls routes that changed shape, or misses new
 * ones (or, for a route that became secured, sends no bearer token).
 *
 * `clientConfig.json` is the baseline on purpose: it is the wire format the
 * generators consume, and #1405 removed a separate snapshot copy for being
 * less faithful. Fix drift with `yarn lg:update-clients` against a running API.
 */
const REPO_ROOT = join(__dirname, '../../../..')

const CLIENTS: Record<string, string> = {
  swagger: 'apps/legal-gazette-web/clientConfig.json',
  'application-web-swagger':
    'apps/legal-gazette-application-web/clientConfig.json',
  'public-swagger': 'apps/legal-gazette-public-web/clientConfig.json',
}

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

describe('Generated client configs', () => {
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

  it.each(Object.entries(CLIENTS))(
    '%s matches %s',
    (swaggerPath, clientConfig) => {
      const config = SWAGGER_CONFIG.find((c) => c.swaggerPath === swaggerPath)
      if (!config) throw new Error(`No SWAGGER_CONFIG entry "${swaggerPath}"`)

      expect(
        describeDrift(buildSwaggerDocument(app, config), clientConfig),
      ).toEqual([])
    },
  )
})
