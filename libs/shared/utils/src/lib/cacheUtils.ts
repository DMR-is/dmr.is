/* eslint-disable local-rules/no-async-module-init */
import { Cache } from 'cache-manager'
import { redisStore } from 'cache-manager-ioredis-yet'

import { CacheModule, CacheModuleAsyncOptions } from '@nestjs/cache-manager'

import { getLogger } from '@dmr.is/logging'
const host = process.env.REDIS_HOST || 'localhost'
const port = process.env.REDIS_PORT || 6379

export type StoreKeyMapper =
  | 'case'
  | 'ojoi-user'
  | 'ojoi-journal'
  | 'ojoi-statistics'

export const createRedisCacheOptions = (storeKey: StoreKeyMapper) => {
  const logger = getLogger('cacheUtils')
  if (process.env.ENABLE_REDIS !== 'true') {
    logger.info('Redis is disabled')
    return CacheModule.register({
      ttl: 0,
      max: 0,
    })
  }
  logger.info('Initializing Redis cache', {
    host,
    port,
  })
  const options: CacheModuleAsyncOptions = {
    isGlobal: true,
    useFactory: async () => {
      const store = await redisStore({
        name: storeKey,
        nodes: [{ host: host, port: port }],
      })
      return { store: store }
    },
  }
  return CacheModule.registerAsync(options)
}

export const deleteCacheWithPrefix = async (
  cacheManager: Cache,
  prefix: string,
) => {
  const keys = await cacheManager.store.keys(`${prefix}*`)

  keys.forEach(async (key) => {
    await cacheManager.store.del(key)
  })

  return
}

export const delCache = async (cacheManager: Cache, key: string) => {
  await cacheManager.del(key)
}

export const setCache = async (
  cacheManager: Cache,
  key: string,
  value: unknown,
  ttl = 5000,
) => {
  await cacheManager.set(key, value, ttl)
}
