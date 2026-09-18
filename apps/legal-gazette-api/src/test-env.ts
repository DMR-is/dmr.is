/**
 * Jest `setupFiles` entry -- runs before any module in a test file is loaded.
 *
 * The specs in `src/app/` boot the real `AppModule`. Several providers in that
 * graph read their configuration straight from `process.env`, either at module
 * load time or in a constructor, so what they build depends on whatever the
 * ambient shell happens to export. On a developer machine direnv supplies the
 * real values; CI has none of them. Pinning obviously-fake values here makes
 * those providers take the same branch on every machine, so the
 * characterizations measure one shape rather than two.
 *
 * Every value below is a placeholder. Nothing here is a real credential,
 * endpoint or identifier, and no test opens a socket to any of them.
 */

/*
 * `@dmr.is/utils-server/cacheUtils` reads the Redis environment once, at module
 * load time, and picks between `CacheModule.registerAsync` (the shape used in
 * production) and a plain in-memory `CacheModule.register`. `@dmr.is/decorators`
 * likewise turns its caching decorators into no-ops unless `ENABLE_REDIS` is
 * `'true'`. Pinning these keeps `src/app/nest11-module-dedup.spec.ts` measuring
 * the production shape.
 *
 * The host is deliberately unreachable: `@keyv/redis` connects lazily and no
 * test issues a command, so nothing here opens a socket.
 */
process.env.ENABLE_REDIS = 'true'
process.env.REDIS_PREFIX = 'redis'
process.env.REDIS_USER = 'test-user'
process.env.REDIS_PASSWORD = 'test-password'
process.env.REDIS_HOST = '127.0.0.1'
process.env.REDIS_PORT = '6399'

/*
 * `TBRModule.forRoot(...)` is called from four modules in the graph, each
 * reading `process.env` while the module file is being evaluated, and
 * `TBRService`'s constructor throws when any of these is missing. Without
 * these, compiling `AppModule` fails with `TBR credentials not provided`
 * anywhere the real values are absent -- which is every CI run.
 *
 * The base path points at the reserved `.invalid` TLD so that a stray request
 * cannot resolve to a real host.
 */
process.env.LG_TBR_CREDENTIALS = 'test-tbr-user:test-tbr-password'
process.env.LG_TBR_OFFICE_ID = 'test-office-id'
process.env.LG_TBR_PATH = 'https://tbr.invalid/api'
process.env.LG_TBR_CHARGE_CATEGORY_PERSON = 'test-charge-category-person'
process.env.LG_TBR_CHARGE_CATEGORY_COMPANY = 'test-charge-category-company'
process.env.XROAD_DMR_CLIENT = 'test-xroad-client'
