import { INestApplication, VersioningType } from '@nestjs/common'

/**
 * The routing shape every served path is built from, in one place.
 *
 * `SwaggerModule.createDocument` bakes the global prefix and the version segment
 * into every path it emits, and `filterPaths` predicates are written against the
 * resulting *absolute* shape — so `swagger-coverage.spec.ts` has to route its app
 * exactly as `main.ts` does or it compares keys of a different shape than
 * production filters. That already went wrong once: the spec omitted the prefix,
 * so its keys were `/v1/...` while the served document used `/api/v1/...`, and a
 * `filterPaths` edit stripped every draft operation from the island.is document
 * while the suite stayed green.
 *
 * Restating the prefix in both places fixes that instance but not the class of
 * bug — two `'api'` literals still drift independently, and the spec would stay
 * green because it compares keys it generated against constants it declared.
 * `applyApiRouting` removes the second literal: there is one prefix, and the
 * caller cannot route differently from what the guard asserts.
 */
export const GLOBAL_PREFIX = 'api'

/** URI version segment, i.e. `@Controller({ version: '1' })` → `/api/v1/...`. */
export const API_VERSION = 'v1'

/**
 * Applies the global prefix and URI versioning.
 *
 * Order matters to Nest — `setGlobalPrefix` before `enableVersioning` — and is
 * fixed here rather than left to each caller.
 */
export const applyApiRouting = (app: INestApplication): void => {
  app.setGlobalPrefix(GLOBAL_PREFIX)
  app.enableVersioning({ type: VersioningType.URI })
}
