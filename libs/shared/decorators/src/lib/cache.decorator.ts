import { Cache } from 'cache-manager'
import { createHash } from 'node:crypto'

import { getLogger } from '@dmr.is/logging'
import { ResultWrapper } from '@dmr.is/types'

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
  topic?: string // NEW (single)
  topics?: string[] // NEW (multiple)
}

const topicKey = (topic: string) => `__topic:${topic}`

async function indexKeyByTopics(
  cache: Cache,
  cacheKey: string,
  topics: string[],
) {
  for (const t of topics) {
    const tk = topicKey(t)
    const existing = (await cache.get<string[]>(tk)) ?? []
    if (!existing.includes(cacheKey)) {
      existing.push(cacheKey)
      await cache.set(tk, existing, TAG_INDEX_TTL)
    }
  }
}

export async function evictByTopics(cache: Cache, topics: string[]) {
  for (const t of topics) {
    const tk = topicKey(t)
    const keys = (await cache.get<string[]>(tk)) ?? []
    if (keys.length) await Promise.allSettled(keys.map((k) => cache.del(k)))
    await cache.del(tk)
  }
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
export async function evictByTags(
  cache: Cache,
  method: string,
  tagValues: unknown[],
) {
  if (process.env.ENABLE_REDIS !== 'true') return // no-op if caching disabled

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
  const { ttlMs = CACHE_TTL, tagBy = [], topic, topics } = opts

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
              let dataForCache: unknown | undefined
              try {
                dataForCache = ResultWrapper.unwrap(fresh) // throws if err
              } catch {
                // Keep serving the old cached value; don't overwrite with an error
                return
              }
              const exp = Date.now() + ttlMs
              const newEnvelope: CachedEnvelope = { data: dataForCache, exp }
              await cache.set(key, newEnvelope, ttlMs)

              // maintain tag index (if any)
              if (tagBy.length) {
                const tags = tagBy.map((i) => args[i])
                await indexKeyByTags(cache, propertyKey, key, tags)
              }

              const resolvedTopics = [
                ...(topic ? [topic] : []),
                ...(topics ?? []),
              ]
              if (resolvedTopics.length) {
                await indexKeyByTopics(cache, key, resolvedTopics)
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
      let dataForCache: unknown | undefined
      try {
        dataForCache = ResultWrapper.unwrap(result) // throws if err
      } catch {
        // Do NOT cache errors
        return result
      }
      const exp = now + ttlMs
      const newEnvelope: CachedEnvelope = { data: dataForCache, exp }

      await cache.set(key, newEnvelope, ttlMs)

      // tag index for eviction
      if (tagBy.length) {
        const tags = tagBy.map((i) => args[i])
        await indexKeyByTags(cache, propertyKey, key, tags)
      }

      const resolvedTopics = [...(topic ? [topic] : []), ...(topics ?? [])]
      if (resolvedTopics.length) {
        await indexKeyByTopics(cache, key, resolvedTopics)
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
 * - methodsToEvict: array of method names to evict; defaults to the decorated method
 */
export const CacheEvict = (
  idParamIndex = 0,
  optionalParams: Array<number | string> = [],
  methodsToEvict?: string[], // <— new
) => {
  return function (
    _t: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    if (process.env.ENABLE_REDIS !== 'true') return descriptor
    const original = descriptor.value

    descriptor.value = async function (...args: unknown[]) {
      if (!('cacheManager' in this))
        throw new Error('cacheManager instance is required')
      const cache = (this as any).cacheManager as Cache

      const primary = args[idParamIndex]
      const extras = optionalParams.map((p) =>
        typeof p === 'number' ? args[p] : p,
      )
      const tags = [primary, ...extras]

      const result = await original.apply(this, args)

      // Evict tags for the specified methods, or default to this method
      const methods = methodsToEvict?.length ? methodsToEvict : [propertyKey]
      await Promise.all(methods.map((m) => evictByTags(cache, m, tags)))

      return result
    }

    return descriptor
  }
}

export const CacheEvictTopics = (
  topics: string[] | string | ((args: unknown[]) => string[]),
) => {
  return function (_t: unknown, _p: string, descriptor: PropertyDescriptor) {
    if (process.env.ENABLE_REDIS !== 'true') return descriptor
    const original = descriptor.value

    descriptor.value = async function (...args: unknown[]) {
      if (!('cacheManager' in this))
        throw new Error('cacheManager instance is required')
      const cache = (this as any).cacheManager as Cache

      const res = await original.apply(this, args)

      const resolved =
        typeof topics === 'function'
          ? topics(args)
          : Array.isArray(topics)
            ? topics
            : [topics]

      await evictByTopics(cache, resolved)

      return res
    }

    return descriptor
  }
}
