import { INestApplication, VersioningType } from '@nestjs/common'

/**
 * The routing shape every served path is built from, in one place — the same
 * arrangement as `directorate-of-equality-api`, and for the same reason: swagger
 * bakes the prefix and version segment into every path it emits, so a coverage
 * spec has to route its test app exactly as `main.ts` does or it compares keys of
 * a different shape than production serves.
 */
export const GLOBAL_PREFIX = 'api'

/** URI version segment, i.e. `@Controller({ version: '1' })` → `/api/v1/...`. */
export const API_VERSION = 'v1'

/** Order matters to Nest — prefix before versioning — so it is fixed here. */
export const applyApiRouting = (app: INestApplication): void => {
  app.setGlobalPrefix(GLOBAL_PREFIX)
  app.enableVersioning({ type: VersioningType.URI })
}
