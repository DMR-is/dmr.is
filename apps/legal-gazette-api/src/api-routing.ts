import { INestApplication, VersioningType } from '@nestjs/common'

/**
 * The routing shape every served path is built from, in one place.
 *
 * `SwaggerModule.createDocument` bakes the global prefix and the version
 * segment into every path it emits, so the specs that build the document
 * (`app.spec.ts`, `client-config-drift.spec.ts`) must route the app exactly as
 * `main.ts` does. Two copies of `'api'` would drift independently while those
 * specs stayed green, comparing paths production no longer serves. The same
 * helper exists in directorate-of-equality-api for the same reason.
 */
export const GLOBAL_PREFIX = 'api'

/**
 * Applies the global prefix and URI versioning, in the order Nest needs
 * (`setGlobalPrefix` before `enableVersioning`).
 */
export const applyApiRouting = (app: INestApplication): void => {
  app.setGlobalPrefix(GLOBAL_PREFIX)
  app.enableVersioning({ type: VersioningType.URI })
}
