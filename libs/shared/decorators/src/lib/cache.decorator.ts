import { Cache } from 'cache-manager'
import { ResultWrapper } from '@dmr.is/types'

export const Cacheable = () => {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    if (process.env.ENABLE_REDIS !== 'true') {
      return descriptor
    }
    const originalMethod = descriptor.value
    descriptor.value = async function (...args: any[]) {
      if ('cacheManager' in this === false) {
        throw new Error('cacheManager instance is required')
      }
      const cache = this.cacheManager as Cache
      const cacheKey = propertyKey + '_' + JSON.stringify(args)

      const cachedData = await cache.get(cacheKey)
      if (cachedData) {
        // Return cached data immediately and update cache asynchronously
        setTimeout(async () => {
          const result = await originalMethod.apply(this, args)
          cache
            .set(cacheKey, ResultWrapper.unwrap(result), 5000 * 60)
            .catch(() => {
              // Ignore cache update errors
            })
        }, 0)
        return ResultWrapper.ok(cachedData)
      }

      const result = await originalMethod.apply(this, args)
      cache.set(cacheKey, ResultWrapper.unwrap(result), 5000 * 60) // 5 minutes in milliseconds
      return result
    }
    return descriptor
  }
}

export const CacheEvict = (idParamIndex = 0, optionalParams: string[] = []) => {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    if (process.env.ENABLE_REDIS !== 'true') {
      return descriptor
    }
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      if ('cacheManager' in this === false) {
        throw new Error('cacheManager instance is required')
      }

      const cache = this.cacheManager as Cache
      const id = args[idParamIndex]

      const cachePattern = `*${id}*`

      // Execute original method
      const result = await originalMethod.apply(this, args)

      // Delete all cache entries containing the ID
      const keys = await cache.store.keys(cachePattern)
      const optionalKeys = await cache.store.keys(`*${optionalParams.join('*')}*`)
      console.log('optionalKeys', optionalKeys)
      await Promise.all(keys.map((key) => cache.del(key)))
      await Promise.all(optionalKeys.map((key) => cache.del(key)))

      return result
    }
    return descriptor
  }
}
