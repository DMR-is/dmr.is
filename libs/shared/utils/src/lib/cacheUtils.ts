import { Cache } from 'cache-manager'
import { CacheModule, CacheModuleAsyncOptions } from '@nestjs/cache-manager'
import { getLogger } from '@dmr.is/logging'

import Keyv from 'keyv'
import KeyvRedis from '@keyv/redis'

const logger = getLogger('cacheUtils')
const urlFromEnv = process.env.REDIS_URL
const isTLS = !!urlFromEnv?.startsWith('rediss://')

export type StoreKeyMapper =
  | 'case'
  | 'ojoi-user'
  | 'ojoi-journal'
  | 'ojoi-statistics'

export const createRedisCacheOptions = (namespace: StoreKeyMapper) => {
  if (process.env.ENABLE_REDIS !== 'true') {
    logger.info('Redis is disabled')
    return CacheModule.register({ ttl: 0, max: 0 })
  }

  if (!urlFromEnv) {
    logger.warn(
      'ENABLE_REDIS=true but no REDIS_URL provided; falling back to in-memory',
    )
    return CacheModule.register({ ttl: 0, max: 0 })
  }

  logger.info('Initializing Redis cache', { urlProvided: true })

  const options: CacheModuleAsyncOptions = {
    isGlobal: true,
    useFactory: async () => {
      const redisStore = new KeyvRedis({
        url: urlFromEnv,
        ...(isTLS && {
          socket: {
            tls: true,
            rejectUnauthorized: false,
          },
        }),
      })

      const keyv = new Keyv({
        store: redisStore,
        namespace,
      })

      keyv.on('error', (err) =>
        logger.error('Redis cache error', { err: err.message }),
      )

      return { stores: [keyv] }
    },
  }

  return CacheModule.registerAsync(options)
}

// helpers stay the same:
export const clearNamespace = async (cacheManager: Cache) =>
  cacheManager.clear()

export const delCache = async (cacheManager: Cache, key: string) =>
  cacheManager.del(key)

export const setCache = async (
  cacheManager: Cache,
  key: string,
  value: unknown,
  ttlMs = 5000,
) => cacheManager.set(key, value, ttlMs)
