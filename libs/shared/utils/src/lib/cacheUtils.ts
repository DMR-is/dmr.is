/* eslint-disable local-rules/no-async-module-init */
import { Cache } from 'cache-manager'
import Keyv from 'keyv'

import { CacheModule, CacheModuleAsyncOptions } from '@nestjs/cache-manager'

import { getLogger } from '@dmr.is/logging'

import KeyvRedis from '@keyv/redis'

const logger = getLogger('cacheUtils')

const prefix = process.env.REDIS_PREFIX || 'rediss'

const user = process.env.REDIS_USER
const pass = process.env.REDIS_PASSWORD
const host = process.env.REDIS_HOST
const port = process.env.REDIS_PORT
const urlFromEnv = `${prefix}://${user}:${pass}@${host}:${port}`
const isTLS = !!urlFromEnv?.startsWith('rediss://')

export type StoreKeyMapper =
  | 'ojoi-case'
  | 'ojoi-user'
  | 'ojoi-journal'
  | 'ojoi-statistics'

export const createRedisCacheOptions = (namespace: StoreKeyMapper) => {
  if (process.env.ENABLE_REDIS !== 'true') {
    logger.info('Redis is disabled')
    return CacheModule.register({ ttl: 0, max: 0 })
  }

  // Check if any part of the URL is missing
  if (!user || !pass || !host || !port) {
    logger.warn(
      'ENABLE_REDIS=true but some REDIS_* environment variables are missing; falling back to in-memory',
      {
        userProvided: !!user,
        passProvided: !!pass,
        hostProvided: !!host,
        portProvided: !!port,
      },
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
        serialize: (v: unknown): string => JSON.stringify(v),
        deserialize: (v) =>
          JSON.parse(Buffer.isBuffer(v) ? v.toString('utf8') : (v as string)),
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
