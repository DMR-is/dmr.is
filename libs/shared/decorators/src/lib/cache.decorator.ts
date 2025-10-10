import { Cache } from 'cache-manager'
import { getLogger } from '@dmr.is/logging'
import { ResultWrapper } from '@dmr.is/types'

import { createHash } from 'node:crypto'

const logger = getLogger('cache.decorator')

// Near-expiry refresh threshold: 1 minute
const REFRESH_THRESHOLD = 60_000
// Default cache TTL: 5 minutes (ms)
const CACHE_TTL = 5 * 60_000
// Tag index TTL (so orphan indexes don’t live forever).
const TAG_INDEX_TTL = 24 * 60_60_000 // 24h

type CachedEnvelope<T = unknown> = {
  data: T // the actual cached payload (unwrapped)
  exp: number // absolute epoch ms when this entry should expire
}

/**
 * Cacheable options:
 * - ttlMs: default per-key ttl
 * - tagBy: argument indices to index/eject by (e.g., [0] => first arg is the id)
 */
type CacheableOptions = {
  ttlMs?: number
  tagBy?: number[]
}

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v)

function canonicalize(v: unknown): unknown {
  if (Array.isArray(v)) {
    // If array items are primitives, sort; otherwise just canonicalize order-preserving
    const primitive = v.every(
      (x) => x === null || ['string', 'number', 'boolean'].includes(typeof x),
    )
    const arr = v.map(canonicalize)
    return primitive
      ? arr.sort((a, b) => String(a).localeCompare(String(b)))
      : arr
  }
  if (isPlainObject(v)) {
    const out: Record<string, unknown> = {}
    for (const k of Object.keys(v).sort()) {
      const val = (v as any)[k]
      if (val === undefined) continue // drop undefined to stabilize
      out[k] = canonicalize(val)
    }
    return out
  }
  return v
}

function stableStringify(v: unknown) {
  return JSON.stringify(canonicalize(v))
}

function hashKey(s: string, len = 24) {
  return createHash('sha1').update(s).digest('hex').slice(0, len)
}

const buildCacheKey = (method: string, args: unknown[]) => {
  const json = stableStringify(args)
  return `${method}:${hashKey(json)}`
}

// Tag key to track all cache keys associated with an ID (to support eviction)
const tagKey = (method: string, tagValue: unknown) =>
  `__tag:${method}:${stableStringify(tagValue)}`

/** add cacheKey to the tag index (set/list) for each tagValue */
async function indexKeyByTags(
  cache: Cache,
  method: string,
  cacheKey: string,
  tagValues: unknown[],
) {
  for (const tv of tagValues) {
    const tk = tagKey(method, tv)
    const existing = (await cache.get<string[]>(tk)) ?? []
    if (!existing.includes(cacheKey)) {
      existing.push(cacheKey)
      // store/refresh the tag index; we give it a long TTL to outlive entries
      await cache.set(tk, existing, TAG_INDEX_TTL)
    }
  }
}

/** remove all keys referenced by the tag indexes, then remove the tag indexes */
async function evictByTags(cache: Cache, method: string, tagValues: unknown[]) {
  for (const tv of tagValues) {
    const tk = tagKey(method, tv)
    const keys = (await cache.get<string[]>(tk)) ?? []
    if (keys.length) {
      // best-effort delete; ignore individual failures
      await Promise.allSettled(keys.map((k) => cache.del(k)))
    }
    await cache.del(tk)
  }
}

/**
 * @Cacheable({ tagBy: [...] })
 * Stores envelope { data, exp } so we can refresh when near-expiry.
 * On hit:
 *   - return cached data
 *   - if remaining < REFRESH_THRESHOLD => async refresh (don’t block)
 * On miss:
 *   - compute, set envelope, index by tagBy values (if provided), return result
 */
export const Cacheable = (opts: CacheableOptions = {}) => {
  const { ttlMs = CACHE_TTL, tagBy = [] } = opts

  return function (
    _target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    if (process.env.ENABLE_REDIS !== 'true') return descriptor

    const originalMethod = descriptor.value

    descriptor.value = async function (...args: unknown[]) {
      if (!('cacheManager' in this)) {
        throw new Error('cacheManager instance is required')
      }
      const cache = (this as any).cacheManager as Cache
      const key = buildCacheKey(propertyKey, args)

      // Try cache
      const envelope = (await cache.get<CachedEnvelope>(key)) || null
      const now = Date.now()

      if (envelope) {
        // schedule background refresh if near expiry
        const remaining = envelope.exp - now

        if (remaining < REFRESH_THRESHOLD) {
          setTimeout(async () => {
            try {
              const fresh = await originalMethod.apply(this, args)
              const data = ResultWrapper.unwrap(fresh)
              const exp = Date.now() + ttlMs
              const newEnvelope: CachedEnvelope = { data, exp }

              await cache.set(key, newEnvelope, ttlMs)

              // maintain tag index (if any)
              if (tagBy.length) {
                const tags = tagBy.map((i) => args[i])
                await indexKeyByTags(cache, propertyKey, key, tags)
              }
            } catch (error) {
              // non-fatal
              logger.error('Failed to background-refresh cache', {
                cacheKey: key,
                error,
              })
            }
          }, 0)
        }

        return ResultWrapper.ok(envelope.data)
      }

      // Miss: compute
      const result = await originalMethod.apply(this, args)
      const data = ResultWrapper.unwrap(result)
      const exp = now + ttlMs
      const newEnvelope: CachedEnvelope = { data, exp }

      await cache.set(key, newEnvelope, ttlMs)

      // tag index for eviction
      if (tagBy.length) {
        const tags = tagBy.map((i) => args[i])
        await indexKeyByTags(cache, propertyKey, key, tags)
      }

      return result
    }

    return descriptor
  }
}

/**
 * @CacheEvict(idParamIndex, optionalParams)
 * Deletes all cache entries previously tagged with the provided id(s).
 * Works without wildcard KEYS/SCAN.
 *
 * - idParamIndex: which argument contains the primary id (default 0)
 * - optionalParams: additional arg names or values you want to evict by; if you
 *   used Cacheable({ tagBy: [...] }), pass matching indices or values here.
 */
export const CacheEvict = (
  idParamIndex = 0,
  optionalParams: Array<number | string> = [],
) => {
  return function (
    _target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    if (process.env.ENABLE_REDIS !== 'true') return descriptor

    const originalMethod = descriptor.value

    descriptor.value = async function (...args: unknown[]) {
      if (!('cacheManager' in this)) {
        throw new Error('cacheManager instance is required')
      }

      const cache = (this as any).cacheManager as Cache

      const primary = args[idParamIndex]
      const extras = optionalParams.map((p) =>
        typeof p === 'number' ? args[p] : p,
      )

      logger.info('Evicting cache via tags', {
        method: propertyKey,
        primary,
        extras,
      })

      // Run original method first (or after—up to your semantics)
      const result = await originalMethod.apply(this, args)

      // Evict all keys indexed under the primary id and optional extras
      await evictByTags(cache, propertyKey, [primary, ...extras])

      return result
    }

    return descriptor
  }
}
