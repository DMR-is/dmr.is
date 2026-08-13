/**
 * Jest `setupFiles` entry -- runs before any module in a test file is loaded.
 *
 * `@dmr.is/utils-server/cacheUtils` reads the Redis environment once, at module
 * load time, and picks between `CacheModule.registerAsync` (the shape used in
 * production) and a plain in-memory `CacheModule.register`. Pinning the values
 * here keeps that choice from depending on whichever `.env` Nx happened to
 * load, so the module-graph characterizations in
 * `src/app/nest11-module-dedup.spec.ts` measure the production shape on every
 * machine and in CI.
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
