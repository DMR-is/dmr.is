import { Cache } from 'cache-manager'
import { getLogger } from '@dmr.is/logging'
import { ResultWrapper } from '@dmr.is/types'
const REFRESH_THRESHOLD = 1000 * 60 // 1 minute in milliseconds
const CACHE_TTL = 5000 * 60 // 5 minutes in milliseconds

export const Cacheable = () => {
  return function (
    target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    if (process.env.ENABLE_REDIS !== 'true') {
      return descriptor
    }
    const originalMethod = descriptor.value
    descriptor.value = async function (...args: unknown[]) {
      if ('cacheManager' in this === false) {
        throw new Error('cacheManager instance is required')
      }
      const cache = this.cacheManager as Cache
      const cacheKey = propertyKey + '_' + JSON.stringify(args)

      const cachedData = await cache.get(cacheKey)
      if (cachedData) {
        // Only refresh cache if TTL is less than threshold
        const ttl = await cache.store.ttl(cacheKey)
        if (ttl < REFRESH_THRESHOLD) {
          setTimeout(async () => {
            const result = await originalMethod.apply(this, args)
            cache
              .set(cacheKey, ResultWrapper.unwrap(result), CACHE_TTL)
              .catch((error) => {
                // Ignore cache update errors
                const logger = getLogger('cache.decorator')
                logger.error('Failed to update cache', {
                  cacheKey,
                  error,
                })
              })
          }, 0)
        }
        return ResultWrapper.ok(cachedData)
      }

      const result = await originalMethod.apply(this, args)
      cache.set(cacheKey, ResultWrapper.unwrap(result), CACHE_TTL)
      return result
    }
    return descriptor
  }
}

export const CacheEvict = (idParamIndex = 0, optionalParams: string[] = []) => {
  return function (
    target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    if (process.env.ENABLE_REDIS !== 'true') {
      return descriptor
    }
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: unknown[]) {
      if ('cacheManager' in this === false) {
        throw new Error('cacheManager instance is required')
      }

      const logger = getLogger('cache.decorator')
      logger.info('Evicting cache', {
        cacheKey: propertyKey,
        idParamIndex,
        optionalParams,
      })

      const cache = this.cacheManager as Cache
      const id = args[idParamIndex]

      const cachePattern = `*${id}*`

      // Execute original method
      const result = await originalMethod.apply(this, args)

      // Delete all cache entries containing the ID
      const keys = await cache.store.keys(cachePattern)
      const optionalKeys = await cache.store.keys(
        `*${optionalParams.join('*')}*`,
      )
      const allKeys = [...keys, ...optionalKeys]
      await cache.store.mdel(...allKeys)

      return result
    }
    return descriptor
  }
}
