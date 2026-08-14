import { INestApplication } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger'

import { AppModule } from '../../app/app.module'
import { SWAGGER_CONFIG } from '../../swagger.config'

/**
 * Guards the published swagger surface against the failure mode that hid the
 * whole draft-report flow from the island.is client: a controller wired into
 * `AppModule` (so its routes answer) but absent from every `SWAGGER_CONFIG`
 * document (so no client method is ever generated for it). Nothing else in the
 * build notices — the routes work, the tests pass, and the consumer simply has
 * no way to call them.
 *
 * Every assertion here is made against documents `SwaggerModule.createDocument`
 * actually produces, not against a model of how it scans modules. That is
 * deliberate: a model is what made the first version of this spec unsound. It
 * walked the `imports` graph transitively, but `createDocument` does not —
 * `getModules` filters `include` without expanding it, and the `deepScanRoutes`
 * branch adds exactly **one** level of a listed module's imports and never
 * recurses. So a controller nested two levels under an aggregate passed that
 * walk while being absent from the document: the original bug, with a green
 * test asserting it could not happen.
 *
 * Preview mode builds the module graph without instantiating providers, so the
 * real documents are available here without a database or any other side
 * effect. The roots come from `SWAGGER_CONFIG` itself, so dropping an aggregate
 * from it while leaving it in `AppModule` fails too.
 */

/** `"GET /application/reports/draft"` — one routed, documentable operation. */
type OperationKey = string

/**
 * Routed operations that are deliberately in no published document.
 *
 * Anything reachable from `AppModule` and missing from every document has to be
 * listed here with a reason, so leaving an operation out is a decision rather
 * than an oversight.
 */
const UNEXPOSED: ReadonlySet<OperationKey> = new Set([
  // Infrastructure probe for the cluster, not part of any client contract.
  'GET /health',
])

const operationKeys = (document: OpenAPIObject): OperationKey[] =>
  Object.entries(document.paths).flatMap(([path, item]) =>
    Object.keys(item).map((method) => `${method.toUpperCase()} ${path}`),
  )

const buildDocument = (
  app: INestApplication,
  title: string,
  // eslint-disable-next-line @typescript-eslint/ban-types
  include?: Function[],
): OpenAPIObject =>
  SwaggerModule.createDocument(
    app,
    new DocumentBuilder().setTitle(title).build(),
    {
      // Same options `setupSwaggerDocument` passes in production. Omitting
      // `include` scans every module in the container, which is the routed
      // surface — an unimported api module is not in the container at all, so
      // its controllers cannot show up here.
      deepScanRoutes: true,
      ...(include ? { include } : {}),
    },
  )

const APPLICATION_DOC = 'swagger/application'
const INTERNAL_DOC = 'swagger/internal'

describe('swagger document coverage', () => {
  let app: INestApplication
  /** Every operation the app routes. */
  let routed: OperationKey[]
  /** Every operation reachable through some `SWAGGER_CONFIG` document. */
  let published: Set<OperationKey>
  /** Per-document operation sets, keyed by `swaggerPath`. */
  let documents: Map<string, Set<OperationKey>>

  /** The document served at `swaggerPath`, or a clear failure if there is none. */
  const documentFor = (swaggerPath: string): Set<OperationKey> => {
    const operations = documents.get(swaggerPath)
    if (!operations) {
      throw new Error(`SWAGGER_CONFIG no longer publishes "${swaggerPath}"`)
    }
    return operations
  }

  beforeAll(async () => {
    // The global prefix and URI versioning `main.ts` applies are left off: they
    // shift every path uniformly and every assertion below is relative, so
    // paths read as `/application/...` rather than `/api/v1/application/...`.
    app = await NestFactory.create(AppModule, { preview: true, logger: false })

    routed = operationKeys(buildDocument(app, 'Routed surface'))
    documents = new Map(
      SWAGGER_CONFIG.map((config) => [
        config.swaggerPath,
        new Set(
          operationKeys(
            buildDocument(app, config.swaggerTitle, config.modules),
          ),
        ),
      ]),
    )
    published = new Set([...documents.values()].flatMap((ops) => [...ops]))
  })

  afterAll(async () => {
    await app?.close()
  })

  it('routes a substantial surface', () => {
    // Sanity check on the document build itself — an empty routed set would
    // make every assertion below vacuously true.
    expect(routed.length).toBeGreaterThan(50)
  })

  it('publishes every routed operation, or records why not', () => {
    const undocumented = routed
      .filter((key) => !published.has(key) && !UNEXPOSED.has(key))
      .sort()

    expect(undocumented).toEqual([])
  })

  it('registers every documented aggregate in AppModule', () => {
    // The mirror of the assertion above: an aggregate named only by
    // SWAGGER_CONFIG would publish a client for operations nothing routes.
    const registered = new Set(
      (Reflect.getMetadata('imports', AppModule) ?? []) as unknown[],
    )
    const unregistered = SWAGGER_CONFIG.flatMap((config) =>
      config.modules.filter((module) => !registered.has(module)),
    ).map((module) => module.name)

    expect(unregistered).toEqual([])
  })

  it('scopes every document to at least one module', () => {
    // `createDocument` treats an empty `include` as "no filter" and publishes
    // the entire container, so an aggregate list that ends up empty does not
    // produce an empty document — it produces the admin surface on a
    // public-facing path. Cheap to assert, silent and serious if it happens.
    const unscoped = SWAGGER_CONFIG.filter(
      (config) => config.modules.length === 0,
    ).map((config) => config.swaggerPath)

    expect(unscoped).toEqual([])
  })

  it('serves the whole applicant surface from the application document', () => {
    // The draft-report flow is the one the application system depends on to
    // hold report content it cannot store itself, and it is what went missing.
    // Derived from the routed set rather than listed, so a new applicant
    // endpoint is covered the moment it is routed.
    const application = documentFor(APPLICATION_DOC)
    const applicantOperations = routed.filter((key) =>
      key.includes(' /application/'),
    )

    expect(applicantOperations.length).toBeGreaterThan(20)
    expect(applicantOperations.filter((key) => !application.has(key))).toEqual(
      [],
    )
  })

  it('keeps the applicant and admin surfaces disjoint', () => {
    // An admin-guarded operation leaking into the applicant document would
    // publish reviewer-only endpoints to island.is.
    const internal = documentFor(INTERNAL_DOC)

    const overlap = [...documentFor(APPLICATION_DOC)].filter((key) =>
      internal.has(key),
    )

    expect(overlap).toEqual([])
  })
})
