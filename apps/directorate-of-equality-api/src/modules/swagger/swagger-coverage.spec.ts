import { INestApplication } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { OpenAPIObject } from '@nestjs/swagger'

import { API_VERSION, applyApiRouting, GLOBAL_PREFIX } from '../../api-routing'
import { AppModule } from '../../app/app.module'
import { PUBLIC_ROUTE_METADATA } from '../../core/decorators/public-route.decorator'
import { AdminGuard } from '../../core/guards/admin/admin.guard'
import { RequireAdminRoleGuard } from '../../core/guards/admin-role/require-admin-role.guard'
import { declaresAccess } from '../../core/guards/declared-access/declared-access.guard'
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

/**
 * Swagger's exclusion metadata keys, inlined.
 *
 * They live in `@nestjs/swagger/dist/constants`, which is a deep import: it
 * resolves under the pinned 8.x but 11.x ships an `exports` map that does not
 * expose `./dist/*`, so importing it there fails at *load* time — and a spec that
 * cannot load is a guard that silently does nothing. Nothing local would catch
 * that either: `tsconfig.app.json` excludes specs and jest runs with
 * `diagnostics: false`. Two string constants are not worth that exposure.
 */
const API_EXCLUDE_CONTROLLER = 'swagger/apiExcludeController'
const API_EXCLUDE_ENDPOINT = 'swagger/apiExcludeEndpoint'

/** Nest's `@UseGuards` metadata key (`@nestjs/common/constants`). */
const GUARDS_METADATA = '__guards__'

/**
 * Nest's route metadata key (`PATH_METADATA` in `@nestjs/common/constants`),
 * set on a method by `@Get` / `@Post` / … and by nothing else. Its presence is
 * what makes a prototype method a routed handler.
 */
const PATH_METADATA = 'path'

/** Guards that mark a surface as reviewer-only. */
const ADMIN_GUARDS: readonly unknown[] = [AdminGuard, RequireAdminRoleGuard]

/** `"GET /api/v1/application/reports/draft"` — one routed, documentable operation. */
type OperationKey = string

/**
 * Routed, documentable operations that are deliberately in no published
 * document. Anything else missing is a bug, so leaving an operation out is a
 * decision recorded here rather than an oversight.
 */
const UNPUBLISHED: ReadonlySet<OperationKey> = new Set([
  // Infrastructure probe for the cluster, not part of any client contract.
  'GET /api/v1/health',
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
  // Local-dev S3 bypass (PUT /v1/imports/local). Deliberately unauthenticated,
  // and not registered at all once a bucket is configured, so it must not
  // appear in any published contract. See ImportUploadLocalController.
  'ImportUploadLocalController',
])

/**
 * Controllers allowed to carry `@PublicRoute`, i.e. to answer unauthenticated
 * callers. `DeclaredAccessGuard` refuses everything else that does not declare
 * an audience, so this set is the complete list of endpoints in the API reachable
 * with no credential — the one place to look when asking what is exposed.
 *
 * Asserted as a ceiling rather than an exact match: `ImportUploadLocalController`
 * is only registered when no S3 bucket is configured, so it is legitimately
 * absent in some environments.
 */
const PUBLIC_ROUTE_ALLOWLIST: ReadonlySet<string> = new Set([
  // GET /v1/health — cluster liveness probe. Load balancers send no token.
  'HealthController',
  // PUT /v1/imports/local — local-dev stand-in for an S3 presigned PUT. The
  // browser request carries no Authorization header by design, and the module
  // does not register it once a bucket is configured.
  'ImportUploadLocalController',
])

/**
 * Handlers allowed to require the ADMIN role. Everything else on the internal
 * surface is reachable by any active `doe_user`, per
 * `db/migrations/m-20260520-doe-user-role.js`: ADMIN is "full CRUD on users +
 * reviewer actions", EDITOR is "reviewer actions only — no user management".
 *
 * The three `/users` mutations are that policy verbatim. `ConfigController`
 * goes past it: #1410 gated the salary-threshold write to ADMIN so the API
 * matches the `kerfisstillingar` page, which had always gated itself that way.
 * Reviewer actions stay EDITOR-reachable either way — a system-wide setting is
 * not a reviewer action.
 *
 * Pinned in both directions, unlike the sets above. Widening this silently
 * changes who can act on the register; narrowing it silently hands user
 * management to every reviewer.
 */
const ADMIN_ONLY_HANDLERS: readonly string[] = [
  // Issuing a credential that can submit on a company's behalf, and revoking
  // one, are administrative acts rather than reviewer actions, so both are
  // pinned. Reading the key list deliberately is NOT: it carries no secret, and
  // seeing that a key exists is part of reviewing a company. Mirrors
  // UserController, where listing is open to any active reviewer and only the
  // writes are ADMIN.
  'ApiKeyController.issueApiKey',
  'ApiKeyController.revokeApiKey',
  'ConfigController.updateByKey',
  'UserController.createUser',
  'UserController.deleteUser',
  'UserController.updateUser',
]

/**
 * The draft-report lifecycle, each operation pinned to the `operationId` the
 * generated client turns into a method name. These are the operations whose
 * absence from the client was the original bug: the application system cannot
 * hold report content itself (150kb payload cap), so without them the flow is
 * unreachable. Named explicitly rather than covered by an operation count — a
 * threshold sitting one operation from its boundary reads as a structural
 * assertion while being a tripwire.
 *
 * The `operationId` half is not documentation. A path item holds one operation
 * per method, so two handlers on the same `METHOD` + path are last-writer-wins by
 * OpenAPI object semantics — Nest does not complain, the surviving key still
 * exists, and the loser's client method simply disappears. Every set-based
 * assertion here is blind to that by construction: coverage keys on
 * `METHOD path` and loses the same key on both sides at once, and the duplicate
 * check below cannot see an id that was overwritten *out* of the document.
 * Asserting the id *at* the key is what makes the identity, not just the route,
 * survive a refactor.
 */
const DRAFT_LIFECYCLE: Readonly<Record<OperationKey, string>> = {
  'POST /api/v1/application/reports/draft': 'createApplicationReportDraft',
  'GET /api/v1/application/reports/{providerId}/draft':
    'getApplicationReportDraft',
  'PATCH /api/v1/application/reports/{providerId}/draft':
    'updateApplicationReportDraft',
  'DELETE /api/v1/application/reports/{providerId}/draft':
    'deleteApplicationReportDraft',
  'POST /api/v1/application/reports/{providerId}/draft/sync':
    'syncApplicationReportDraft',
  'POST /api/v1/application/reports/{providerId}/draft/import':
    'importApplicationReportDraftWorkbook',
  'POST /api/v1/application/reports/{providerId}/draft/submit':
    'submitApplicationReportDraft',
}

const APPLICATION_DOC = 'swagger/application'
const INTERNAL_DOC = 'swagger/internal'

/**
 * The applicant aggregate root, as a slash-or-end boundary rather than a literal
 * `'/api/v1/application/'` prefix.
 *
 * `ReportDraftController` already sits at `path: 'application'`, so a bare
 * `@Get()` on it — plausibly the next applicant endpoint added — is served at
 * exactly `/api/v1/application`. A trailing-slash prefix reports that as a
 * foreign operation in an island.is-facing document: it fails safe, but on a
 * legitimate change, which reads as a broken guard.
 */
const APPLICANT_PATH = new RegExp(
  `^/${GLOBAL_PREFIX}/${API_VERSION}/application(/|$)`,
)

/** `"GET /api/v1/x"` → `"/api/v1/x"`. */
const pathOf = (key: OperationKey): string => key.slice(key.indexOf(' ') + 1)

const isApplicant = (key: OperationKey): boolean =>
  APPLICANT_PATH.test(pathOf(key))

/**
 * Every operation in `document`, keyed by `METHOD path` → its `operationId`.
 *
 * A Map rather than a Set because the id is what pins an operation's identity;
 * see `DRAFT_LIFECYCLE`.
 */
const operationsIn = (
  document: OpenAPIObject,
): Map<OperationKey, string | undefined> =>
  new Map(
    Object.entries(document.paths).flatMap(([path, item]) =>
      Object.entries(item).map(
        ([method, operation]) =>
          [
            `${method.toUpperCase()} ${path}`,
            (operation as { operationId?: string }).operationId,
          ] as const,
      ),
    ),
  )

const operationKeys = (document: OpenAPIObject): OperationKey[] => [
  ...operationsIn(document).keys(),
]

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

/**
 * `@ApiExcludeController` / `@ApiExcludeEndpoint` markers on a controller.
 *
 * Both decorators take a `disable` argument defaulting to true and store it —
 * the controller one as `[disable]`, the endpoint one as `{ disable }` — so the
 * flag is read rather than the metadata's presence. `@ApiExcludeEndpoint(false)`
 * excludes nothing, and reporting it as an exclusion would block a legitimate
 * use.
 */
// eslint-disable-next-line @typescript-eslint/ban-types
const swaggerExclusions = (controller: Function): string[] => {
  const onClass: [boolean] | undefined = Reflect.getMetadata(
    API_EXCLUDE_CONTROLLER,
    controller,
  )
  if (onClass?.[0]) {
    return [controller.name]
  }

  return Object.getOwnPropertyNames(controller.prototype)
    .filter((method) => method !== 'constructor')
    .filter(
      (method) =>
        (
          Reflect.getMetadata(
            API_EXCLUDE_ENDPOINT,
            controller.prototype[method],
          ) as { disable?: boolean } | undefined
        )?.disable,
    )
    .map((method) => `${controller.name}.${method}`)
}

/**
 * Every routed handler swagger is expected to document, as
 * `ControllerName.method`.
 *
 * Counted off the container rather than read out of a document, which is the
 * whole point: it is the only side of the comparison a route-key collision cannot
 * move. Two handlers on the same `METHOD` + path collapse to one operation in
 * every document while both remain here, so the counts diverge. No route paths
 * are resolved — that would re-implement what `createDocument` does, the mistake
 * this spec exists to avoid — only handlers are counted.
 *
 * Own properties are enough because no controller in this app extends another;
 * `guardsOn` and `swaggerExclusions` above rely on the same thing.
 */
const documentableHandlers = (app: INestApplication): string[] =>
  // eslint-disable-next-line @typescript-eslint/ban-types
  [...new Set<Function>(routedControllers(app))]
    .filter(
      (controller) =>
        !(
          Reflect.getMetadata(API_EXCLUDE_CONTROLLER, controller) as
            | [boolean]
            | undefined
        )?.[0],
    )
    .flatMap((controller) => {
      const excluded = new Set(swaggerExclusions(controller))

      return Object.getOwnPropertyNames(controller.prototype)
        .filter((method) => method !== 'constructor')
        .filter(
          (method) =>
            Reflect.getMetadata(PATH_METADATA, controller.prototype[method]) !==
            undefined,
        )
        .map((method) => `${controller.name}.${method}`)
        .filter((key) => !excluded.has(key))
    })

/** Every guard `@UseGuards` puts on the class or any of its handlers. */
// eslint-disable-next-line @typescript-eslint/ban-types
const guardsOn = (controller: Function): unknown[] => {
  const fromClass: unknown[] =
    Reflect.getMetadata(GUARDS_METADATA, controller) ?? []

  const fromHandlers = Object.getOwnPropertyNames(controller.prototype)
    .filter((method) => method !== 'constructor')
    .flatMap(
      (method) =>
        (Reflect.getMetadata(
          GUARDS_METADATA,
          controller.prototype[method],
        ) as unknown[]) ?? [],
    )

  return [...fromClass, ...fromHandlers]
}

/**
 * The guards that actually run for one handler: class-level plus its own, which
 * Nest unions rather than overrides.
 *
 * Distinct from `guardsOn` above, which unions *every* handler's guards to ask a
 * question about the controller as a whole. That shape would report a controller
 * as declared when a single handler carried the missing guard, so coverage has to
 * be judged per handler.
 */
// eslint-disable-next-line @typescript-eslint/ban-types
const guardsForHandler = (controller: Function, method: string): unknown[] => [
  ...((Reflect.getMetadata(
    GUARDS_METADATA,
    controller.prototype[method],
  ) as unknown[]) ?? []),
  ...((Reflect.getMetadata(GUARDS_METADATA, controller) as unknown[]) ?? []),
]

/** Every routed handler in the container, as `[controller, method]` pairs. */
const routedHandlers = (
  app: INestApplication,
  // eslint-disable-next-line @typescript-eslint/ban-types
): Array<[Function, string]> =>
  // eslint-disable-next-line @typescript-eslint/ban-types
  [...new Set<Function>(routedControllers(app))].flatMap((controller) =>
    Object.getOwnPropertyNames(controller.prototype)
      .filter((method) => method !== 'constructor')
      .filter(
        (method) =>
          Reflect.getMetadata(PATH_METADATA, controller.prototype[method]) !==
          undefined,
      )
      // eslint-disable-next-line @typescript-eslint/ban-types
      .map((method): [Function, string] => [controller, method]),
  )

/**
 * The `@PublicRoute` reason in force for one handler, class-level or its own.
 * Mirrors the guard's `getAllAndOverride([handler, class])`.
 */
const publicRouteReason = (
  // eslint-disable-next-line @typescript-eslint/ban-types
  controller: Function,
  method: string,
): string | undefined =>
  Reflect.getMetadata(PUBLIC_ROUTE_METADATA, controller.prototype[method]) ??
  Reflect.getMetadata(PUBLIC_ROUTE_METADATA, controller)

/**
 * Every controller anywhere under `roots`, by walking module metadata.
 *
 * Deliberately unbounded, unlike swagger's one-level scan: this is used to reject
 * admin-guarded controllers under the applicant aggregate, and one nested two
 * levels deep would be routed-but-undocumented — still wrong, and still worth
 * failing on. Erring wide is the safe direction here.
 */
// eslint-disable-next-line @typescript-eslint/ban-types
const controllersUnder = (roots: Function[]): Function[] => {
  // eslint-disable-next-line @typescript-eslint/ban-types
  const found: Function[] = []
  const seen = new Set<unknown>()
  const queue: unknown[] = [...roots]

  while (queue.length > 0) {
    const entry = queue.shift()
    // Dynamic modules (`SequelizeModule.forFeature(...)`) are `{ module, ... }`.
    const target =
      entry !== null && typeof entry === 'object'
        ? (entry as { module?: unknown }).module
        : entry

    if (typeof target !== 'function' || seen.has(target)) {
      continue
    }
    seen.add(target)

    for (const controller of (Reflect.getMetadata('controllers', target) ??
      []) as unknown[]) {
      if (typeof controller === 'function') {
        found.push(controller)
      }
    }
    for (const imported of (Reflect.getMetadata('imports', target) ??
      []) as unknown[]) {
      queue.push(imported)
    }
  }

  return found
}

describe('swagger document coverage', () => {
  let app: INestApplication
  /** Every operation swagger can document across the whole routed tree. */
  let routed: OperationKey[]
  /** Every operation reachable through some `SWAGGER_CONFIG` document. */
  let published: Set<OperationKey>
  /** Per-document operations, keyed by `swaggerPath` then by `METHOD path`. */
  let documents: Map<string, Map<OperationKey, string | undefined>>

  /** The document served at `swaggerPath`, or a clear failure if there is none. */
  const documentFor = (
    swaggerPath: string,
  ): Map<OperationKey, string | undefined> => {
    const operations = documents.get(swaggerPath)
    if (!operations) {
      throw new Error(`SWAGGER_CONFIG no longer publishes "${swaggerPath}"`)
    }
    return operations
  }

  beforeAll(async () => {
    app = await NestFactory.create(AppModule, { preview: true, logger: false })
    // `applyApiRouting` is the same function `main.ts` calls, not a copy of what
    // it does — `createDocument` bakes the prefix and version into every path and
    // a `filterPaths` predicate is written against the resulting *absolute*
    // shape, so a spec that restates them can be internally consistent while
    // production serves a different root. Omitting the prefix once left a
    // predicate keyed on `/api/v1/...` stripping every draft operation from the
    // served document while this suite stayed green. Versioning matters for a
    // second reason: without it swagger emits no version segment, so a
    // routed-but-undocumented `version: '2'` twin of a documented controller
    // would collide with its v1 key and pass.
    applyApiRouting(app)

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
        operationsIn(buildSwaggerDocument(app, config)),
      ]),
    )
    published = new Set(
      [...documents.values()].flatMap((ops) => [...ops.keys()]),
    )
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
    const foreign = [...documentFor(APPLICATION_DOC).keys()]
      .filter((key) => !isApplicant(key))
      .sort()

    expect(foreign).toEqual([])
  })

  it('keeps admin-guarded controllers out of the applicant aggregate', () => {
    // The path check above is necessary but not sufficient: path and guard are
    // independent, so an admin controller re-pathed under `application/` and
    // wired into this aggregate satisfies it while publishing reviewer-only
    // operations to island.is. Contract disclosure rather than an authz bypass —
    // AdminGuard still rejects at runtime — but the guard should enforce what its
    // comment claims.
    const applicationAggregate = SWAGGER_CONFIG.find(
      (config) => config.swaggerPath === APPLICATION_DOC,
    )
    const offenders = controllersUnder(applicationAggregate?.modules ?? [])
      .filter((controller) =>
        guardsOn(controller).some((guard) => ADMIN_GUARDS.includes(guard)),
      )
      .map((controller) => controller.name)
      .sort()

    expect(offenders).toEqual([])
  })

  it('gives every operation in a document a unique operationId', () => {
    // operationIds are hand-written per handler via `DoeResponse`, and the
    // generated client turns each into a method name — two operations sharing one
    // silently collapses to a single method. Invisible to the coverage
    // comparison, which keys on method+path.
    const duplicates = SWAGGER_CONFIG.flatMap((config) => {
      const document = buildSwaggerDocument(app, config)
      const seen = new Map<string, number>()

      for (const item of Object.values(document.paths)) {
        for (const operation of Object.values(item)) {
          const id = (operation as { operationId?: string }).operationId
          if (id) {
            seen.set(id, (seen.get(id) ?? 0) + 1)
          }
        }
      }

      return [...seen.entries()]
        .filter(([, count]) => count > 1)
        .map(([id, count]) => `${config.swaggerPath}: ${id} ×${count}`)
    }).sort()

    expect(duplicates).toEqual([])
  })

  it('serves the whole applicant surface from the application document', () => {
    const application = documentFor(APPLICATION_DOC)
    const applicantOperations = routed.filter(isApplicant)

    expect(
      applicantOperations.filter((key) => !application.has(key)).sort(),
    ).toEqual([])
  })

  it('serves the draft-report lifecycle to island.is under its own operationIds', () => {
    // The flow that was missing. Named explicitly so removing it from the
    // document fails on the operations themselves rather than on a count, and
    // pinned to its operationIds so a route-key collision — which keeps the key
    // and silently overwrites the id, taking the client method with it — fails
    // here too. See DRAFT_LIFECYCLE.
    const application = documentFor(APPLICATION_DOC)

    const wrong = Object.entries(DRAFT_LIFECYCLE)
      .filter(([key, operationId]) => application.get(key) !== operationId)
      .map(([key, operationId]) =>
        application.has(key)
          ? `${key} — expected operationId "${operationId}", document has "${
              application.get(key) ?? '(none)'
            }"`
          : `${key} — absent from the document (expected "${operationId}")`,
      )

    expect(wrong).toEqual([])
  })

  it('publishes one operation per routed handler', () => {
    // Backstop for the same collision, beyond the draft lifecycle: a path item
    // holds one operation per method, so two handlers sharing a `METHOD` + path
    // silently drop one. Both handlers still exist in the container, so the
    // counts diverge — whereas every set-based assertion above keys on
    // `METHOD path` and loses the same key on both sides at once.
    //
    // `routed` is the no-`include` document, i.e. the whole container, which is
    // what makes this comparable to the container-side count.
    expect(routed.length).toBe(documentableHandlers(app).length)
  })

  it('keeps the applicant and admin surfaces disjoint', () => {
    const internal = documentFor(INTERNAL_DOC)

    const overlap = [...documentFor(APPLICATION_DOC).keys()].filter((key) =>
      internal.has(key),
    )

    expect(overlap).toEqual([])
  })

  /**
   * Authorization coverage, kept here rather than in its own spec because this is
   * the only place that boots the container — `routedControllers` reads what Nest
   * actually registered, which is the sole side of the comparison a forgotten
   * `@UseGuards` cannot move.
   *
   * `DeclaredAccessGuard` already refuses undeclared routes at runtime. These
   * assertions move that failure from the first request to CI, and pin the two
   * lists the guard consults so neither can be widened quietly.
   */
  describe('default-deny coverage', () => {
    it('declares an access policy for every routed handler', () => {
      // Ordered first: the two assertions below constrain the exceptions, and both
      // pass vacuously the moment routes stop being guarded at all.
      const undeclared = routedHandlers(app)
        .filter(
          ([controller, method]) => !publicRouteReason(controller, method),
        )
        .filter(
          ([controller, method]) =>
            !declaresAccess(guardsForHandler(controller, method)),
        )
        .map(([controller, method]) => `${controller.name}.${method}`)
        .sort()

      expect(undeclared).toEqual([])
    })

    it('exposes no unauthenticated handler outside the allowlist', () => {
      const unlisted = routedHandlers(app)
        .filter(([controller, method]) => publicRouteReason(controller, method))
        .filter(([controller]) => !PUBLIC_ROUTE_ALLOWLIST.has(controller.name))
        .map(([controller, method]) => `${controller.name}.${method}`)
        .sort()

      expect(unlisted).toEqual([])
    })

    it('restricts the ADMIN role requirement to user management, config and API keys', () => {
      const adminOnly = routedHandlers(app)
        .filter(([controller, method]) =>
          guardsForHandler(controller, method).includes(RequireAdminRoleGuard),
        )
        .map(([controller, method]) => `${controller.name}.${method}`)
        .sort()

      expect(adminOnly).toEqual([...ADMIN_ONLY_HANDLERS])
    })

    it('guards a substantial surface', () => {
      // Anti-vacuity floor in the style of the routing check above: every
      // assertion here is "no offenders", so an empty handler list satisfies all
      // three. Loose bounds, so a legitimate new endpoint does not trip them.
      const handlers = routedHandlers(app)

      expect(handlers.length).toBeGreaterThan(50)
      expect(
        handlers.filter(([controller, method]) =>
          declaresAccess(guardsForHandler(controller, method)),
        ).length,
      ).toBeGreaterThan(50)
    })
  })
})
