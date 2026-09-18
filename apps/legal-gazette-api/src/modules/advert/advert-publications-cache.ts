import { createRedisCacheOptions } from '@dmr.is/utils-server/cacheUtils'

/**
 * The single `CacheModule` object reference for the `lg-advert-publications`
 * cache, shared by publishing.task, publication.provider and
 * advert-publish.provider.
 *
 * Nest 10 deduplicated dynamic modules by hashing their metadata, so three
 * separate `createRedisCacheOptions('lg-advert-publications')` calls collapsed
 * into one `CacheModule` with one cache manager -- and therefore one Redis
 * client. Nest 11 keys deduplication on object *reference*, so each call site
 * would build its own client (three connections against a Redis whose
 * connection budget is sized for one) and, whenever `createRedisCacheOptions`
 * takes its in-memory fallback branch, its own independent cache that the other
 * two never invalidate. Importing this one object keeps the Nest 10 shape --
 * measured in `src/app/nest11-module-dedup.spec.ts`.
 */
export const AdvertPublicationsCacheModule = createRedisCacheOptions(
  'lg-advert-publications',
)
