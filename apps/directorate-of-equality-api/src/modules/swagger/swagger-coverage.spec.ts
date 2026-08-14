import { INestApplication, VersioningType } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { OpenAPIObject } from '@nestjs/swagger'
import { DECORATORS } from '@nestjs/swagger/dist/constants'

import { AppModule } from '../../app/app.module'
import { buildSwaggerDocument } from '../../setupSwaggerDocument'
import { SWAGGER_CONFIG } from '../../swagger.config'

/**
 * Guards the published swagger surface against the failure mode that hid the
 * whole draft-report flow from the island.is client: a controller wired into
 * `AppModule` (so its routes answer) but absent from every `SWAGGER_CONFIG`
 * document (so no client method is ever generated for it). Nothing else in the
 * build notices — the routes work, the tests pass, and the consumer simply has
 * no way to call them.
 *
 * Two rules make that detectable, and both are needed:
 *
 *  1. Every operation swagger *can* document must appear in some published
 *     document. Asserted against documents `buildSwaggerDocument` produces —
 *     the same function `main.ts` serves, so `filterPaths` and the tagging pass
 *     are in scope. Re-implementing that call instead is how an earlier version
 *     of this spec stayed green while a `filterPaths` edit removed all 17 draft
 *     operations from the served document.
 *
 *  2. Nothing may make itself undocumentable unrecorded. Rule 1 compares two
 *     sets both derived from swagger, so `@ApiExcludeEndpoint` /
 *     `@ApiExcludeController` drop an operation from *both* sides at once and
 *     the diff stays empty — exclusions must therefore be checked against the
 *     module container, which knows what is routed regardless of what swagger
 *     will emit. Note `@Route({ exclude: true })` from `@dmr.is/decorators`
 *     applies `ApiExcludeEndpoint()` from a single option flag, so this is a
 *     one-word edit away.
 *
 * Preview mode builds the module graph without instantiating providers, so both
 * the documents and the container are available here without a database or any
 * other side effect.
 */

/** `"GET /v1/application/reports/draft"` — one routed, documentable operation. */
type OperationKey = string

/**
 * Routed, documentable operations that are deliberately in no published
 * document. Anything else missing is a bug, so leaving an operation out is a
 * decision recorded here rather than an oversight.
 */
const UNPUBLISHED: ReadonlySet<OperationKey> = new Set([
  // Infrastructure probe for the cluster, not part of any client contract.
  'GET /v1/health',
])

/**
 * Routed handlers deliberately hidden from swagger altogether, keyed by
 * `ControllerName` (whole controller) or `ControllerName.method` (one handler).
 *
 * Being here means the operation reaches no published document *and* cannot be
 * seen by the coverage comparison above, so it is the strongest form of "no
 * client will ever call this" — hence it is recorded separately and with a
 * reason.
 */
const HIDDEN_FROM_SWAGGER: ReadonlySet<string> = new Set([
  // Local-dev S3 bypass (PUT /v1/imports/local). Deliberately unguarded and
  // inert once a bucket is configured, so it must not appear in any published
  // contract. See ImportUploadLocalController.
  'ImportUploadLocalController',
])

/**
 * The draft-report lifecycle. These are the operations whose absence from the
 * client was the original bug: the application system cannot hold report content
 * itself (150kb payload cap), so without them the flow is unreachable. Named
 * explicitly rather than covered by an operation count — a threshold sitting one
 * operation from its boundary reads as a structural assertion while being a
 * tripwire.
 */
const DRAFT_LIFECYCLE: readonly OperationKey[] = [
  'POST /v1/application/reports/draft',
  'GET /v1/application/reports/{providerId}/draft',
  'PATCH /v1/application/reports/{providerId}/draft',
  'DELETE /v1/application/reports/{providerId}/draft',
  'POST /v1/application/reports/{providerId}/draft/sync',
  'POST /v1/application/reports/{providerId}/draft/import',
  'POST /v1/application/reports/{providerId}/draft/submit',
]

const APPLICATION_DOC = 'swagger/application'
const INTERNAL_DOC = 'swagger/internal'
/** Path segment every applicant-facing operation shares. */
const APPLICANT_PREFIX = '/v1/application/'

const operationKeys = (document: OpenAPIObject): OperationKey[] =>
  Object.entries(document.paths).flatMap(([path, item]) =>
    Object.keys(item).map((method) => `${method.toUpperCase()} ${path}`),
  )

/** Every controller Nest actually routes, straight from the module container. */
const routedControllers = (app: INestApplication) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const modules = (app as any).container.getModules()
  // eslint-disable-next-line @typescript-eslint/ban-types
  const found: Function[] = []

  for (const module of modules.values()) {
    for (const wrapper of module.controllers.values()) {
      if (typeof wrapper.metatype === 'function') {
        found.push(wrapper.metatype)
      }
    }
  }

  return found
}

/** `@ApiExcludeController` / `@ApiExcludeEndpoint` markers on a controller. */
// eslint-disable-next-line @typescript-eslint/ban-types
const swaggerExclusions = (controller: Function): string[] => {
  if (Reflect.getMetadata(DECORATORS.API_EXCLUDE_CONTROLLER, controller)) {
    return [controller.name]
  }

  return Object.getOwnPropertyNames(controller.prototype)
    .filter((method) => method !== 'constructor')
    .filter((method) =>
      Reflect.getMetadata(
        DECORATORS.API_EXCLUDE_ENDPOINT,
        controller.prototype[method],
      ),
    )
    .map((method) => `${controller.name}.${method}`)
}

describe('swagger document coverage', () => {
  let app: INestApplication
  /** Every operation swagger can document across the whole routed tree. */
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
    app = await NestFactory.create(AppModule, { preview: true, logger: false })
    // URI versioning matches `main.ts` and is what puts `/v1` in every key.
    // Without it swagger emits no version segment, so a routed-but-undocumented
    // `version: '2'` twin of a documented controller would collide with its v1
    // key and pass. The global prefix is left off — it shifts every path
    // uniformly and every assertion here is relative.
    app.enableVersioning({ type: VersioningType.URI })

    // No `include` scans every module in the container, which is the routed
    // surface: an unimported api module is not in the container at all, so its
    // controllers cannot show up here.
    routed = operationKeys(
      buildSwaggerDocument(app, {
        modules: [],
        tag: 'Routed surface',
        swaggerTitle: 'Routed surface',
        swaggerDescription: 'Every operation the app routes.',
        swaggerPath: 'swagger/__routed',
        autoTagControllers: true,
      }),
    )

    documents = new Map(
      SWAGGER_CONFIG.map((config) => [
        config.swaggerPath,
        new Set(operationKeys(buildSwaggerDocument(app, config))),
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
    expect(routedControllers(app).length).toBeGreaterThan(10)
  })

  it('publishes every routed operation, or records why not', () => {
    const undocumented = routed
      .filter((key) => !published.has(key) && !UNPUBLISHED.has(key))
      .sort()

    expect(undocumented).toEqual([])
  })

  it('hides nothing from swagger without recording it', () => {
    // The comparison above cannot see these: an excluded operation is absent
    // from `routed` and `published` alike, so the diff stays empty while the
    // client loses a method. Checked against the container instead.
    const hidden = routedControllers(app)
      .flatMap(swaggerExclusions)
      .filter((key) => !HIDDEN_FROM_SWAGGER.has(key))
      .sort()

    expect(hidden).toEqual([])
  })

  it('registers every documented aggregate in AppModule', () => {
    // The mirror of the coverage assertion: an aggregate named only by
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
    // public-facing path.
    const unscoped = SWAGGER_CONFIG.filter(
      (config) => config.modules.length === 0,
    ).map((config) => config.swaggerPath)

    expect(unscoped).toEqual([])
  })

  it('publishes nothing but applicant operations to island.is', () => {
    // Positive assertion, not an intersection: an admin-guarded module wired
    // into the applicant aggregate by mistake puts reviewer-only operations in
    // the island.is-facing document without overlapping the internal one, so
    // comparing the two documents cannot see it. The three unreferenced api
    // modules (report-create / report-excel / report-result) are exactly what
    // someone would wire in, and this aggregate is the shorter list.
    const foreign = [...documentFor(APPLICATION_DOC)]
      .filter((key) => !key.includes(APPLICANT_PREFIX))
      .sort()

    expect(foreign).toEqual([])
  })

  it('serves the whole applicant surface from the application document', () => {
    const application = documentFor(APPLICATION_DOC)
    const applicantOperations = routed.filter((key) =>
      key.includes(APPLICANT_PREFIX),
    )

    expect(
      applicantOperations.filter((key) => !application.has(key)).sort(),
    ).toEqual([])
  })

  it('serves the draft-report lifecycle to island.is', () => {
    // The flow that was missing. Named explicitly so removing it from the
    // document fails on the operations themselves rather than on a count.
    const application = documentFor(APPLICATION_DOC)

    expect(DRAFT_LIFECYCLE.filter((key) => !application.has(key))).toEqual([])
  })

  it('keeps the applicant and admin surfaces disjoint', () => {
    const internal = documentFor(INTERNAL_DOC)

    const overlap = [...documentFor(APPLICATION_DOC)].filter((key) =>
      internal.has(key),
    )

    expect(overlap).toEqual([])
  })
})
