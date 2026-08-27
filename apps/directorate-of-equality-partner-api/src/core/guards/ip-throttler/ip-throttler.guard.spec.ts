import { Reflector } from '@nestjs/core'
import { ThrottlerStorage } from '@nestjs/throttler'

import { ApiKeyThrottlerGuard } from '../api-key-throttler/api-key-throttler.guard'
import { PER_IP_THROTTLER, PER_KEY_THROTTLER } from '../throttlers'
import { IpThrottlerGuard } from './ip-throttler.guard'

const OPTIONS = [
  { name: PER_KEY_THROTTLER, ttl: 3600000, limit: 5000 },
  { name: PER_IP_THROTTLER, ttl: 60000, limit: 600, setHeaders: false },
]

const contextFor = (request: Record<string, unknown>, handler = 'getCompany') =>
  ({
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => ({ header: jest.fn() }),
    }),
    getHandler: () => ({ name: handler }),
    getClass: () => ({ name: 'PartnerController' }),
  }) as never

const storageFor = (increment: jest.Mock): ThrottlerStorage =>
  ({ increment }) as never

const okIncrement = () =>
  jest.fn().mockResolvedValue({
    totalHits: 1,
    timeToExpire: 60,
    isBlocked: false,
    timeToBlockExpire: 0,
  })

const build = async <T>(
  Guard: new (...args: never[]) => T,
  increment: jest.Mock,
): Promise<T> => {
  const reflector = new Reflector()
  jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined as never)

  const guard = new Guard(...([
    OPTIONS,
    storageFor(increment),
    reflector,
  ] as never[]))

  await (guard as { onModuleInit(): Promise<void> }).onModuleInit()

  return guard
}

describe('IpThrottlerGuard', () => {
  it('counts a request that has not been authenticated', async () => {
    // The reason this guard exists. ApiKeyGuard throws on a bad credential, so
    // every controller-level guard after it — the per-key throttler included —
    // is unreachable on the 401 path. Registered globally, this one runs first
    // and is the only thing that increments for a request that never
    // authenticates.
    const increment = okIncrement()
    const guard = await build(IpThrottlerGuard, increment)

    await guard.canActivate(contextFor({ ip: '203.0.113.9' }))

    expect(increment).toHaveBeenCalledTimes(1)
  })

  it('enforces only the per-IP bucket, never the per-key allowance', async () => {
    // Both guards read skip metadata from the same handler, so @SkipThrottle
    // cannot separate them; each narrows the throttlers it iterates instead. If
    // this regressed, an IP would be handed the 5000/hour tenant allowance.
    const increment = okIncrement()
    const guard = await build(IpThrottlerGuard, increment)

    await guard.canActivate(contextFor({ ip: '203.0.113.9' }))

    expect(increment).toHaveBeenCalledTimes(1)
    expect(increment.mock.calls[0][4]).toBe(PER_IP_THROTTLER)
  })

  it('buckets the whole surface together rather than per route', async () => {
    // The base class hashes controller and handler name into the storage key.
    // Per route, a flood spread across the thirteen operations would multiply
    // its allowance by thirteen.
    const increment = okIncrement()
    const guard = await build(IpThrottlerGuard, increment)

    await guard.canActivate(contextFor({ ip: '203.0.113.9' }, 'getCompany'))
    await guard.canActivate(contextFor({ ip: '203.0.113.9' }, 'submitSalary'))

    const [firstKey, secondKey] = increment.mock.calls.map((call) => call[0])
    expect(firstKey).toBe(secondKey)
  })

  it('separates two client addresses', async () => {
    const increment = okIncrement()
    const guard = await build(IpThrottlerGuard, increment)

    await guard.canActivate(contextFor({ ip: '203.0.113.9' }))
    await guard.canActivate(contextFor({ ip: '198.51.100.4' }))

    const [firstKey, secondKey] = increment.mock.calls.map((call) => call[0])
    expect(firstKey).not.toBe(secondKey)
  })

  it('still counts a request with no resolvable address', async () => {
    // Better one shared bucket than an uncounted request.
    const increment = okIncrement()
    const guard = await build(IpThrottlerGuard, increment)

    await guard.canActivate(contextFor({}))

    expect(increment).toHaveBeenCalledTimes(1)
  })
})

describe('ApiKeyThrottlerGuard', () => {
  it('enforces only the per-key bucket', async () => {
    const increment = okIncrement()
    const guard = await build(ApiKeyThrottlerGuard, increment)

    await guard.canActivate(
      contextFor({ apiKeyContext: { keyId: 'key-1' }, ip: '203.0.113.9' }),
    )

    expect(increment).toHaveBeenCalledTimes(1)
    expect(increment.mock.calls[0][4]).toBe(PER_KEY_THROTTLER)
  })

  it('spends one allowance per key across every route, not one per route', async () => {
    const increment = okIncrement()
    const guard = await build(ApiKeyThrottlerGuard, increment)

    await guard.canActivate(
      contextFor({ apiKeyContext: { keyId: 'key-1' } }, 'getCompany'),
    )
    await guard.canActivate(
      contextFor({ apiKeyContext: { keyId: 'key-1' } }, 'submitSalary'),
    )

    const [firstKey, secondKey] = increment.mock.calls.map((call) => call[0])
    expect(firstKey).toBe(secondKey)
  })

  it('separates two keys', async () => {
    const increment = okIncrement()
    const guard = await build(ApiKeyThrottlerGuard, increment)

    await guard.canActivate(contextFor({ apiKeyContext: { keyId: 'key-1' } }))
    await guard.canActivate(contextFor({ apiKeyContext: { keyId: 'key-2' } }))

    const [firstKey, secondKey] = increment.mock.calls.map((call) => call[0])
    expect(firstKey).not.toBe(secondKey)
  })

  it('refuses to run without a verified key rather than falling back to the IP', async () => {
    // An IP fallback would silently bucket an entire tenant under one address
    // the moment the guard order changed — a limit that looks fine and measures
    // the wrong thing.
    const increment = okIncrement()
    const guard = await build(ApiKeyThrottlerGuard, increment)

    await expect(
      guard.canActivate(contextFor({ ip: '203.0.113.9' })),
    ).rejects.toThrow()
    expect(increment).not.toHaveBeenCalled()
  })

  it('does not put the guard names where a client can read them', async () => {
    // HttpExceptionFilter genericises `message` but copies the exception's own
    // message into the client-visible `details`.
    const increment = okIncrement()
    const guard = await build(ApiKeyThrottlerGuard, increment)

    try {
      await guard.canActivate(contextFor({ ip: '203.0.113.9' }))
      throw new Error('expected the guard to throw')
    } catch (error) {
      const response = (
        error as { getResponse?: () => unknown }
      ).getResponse?.()
      expect(JSON.stringify(response ?? {})).not.toContain('ApiKeyGuard')
    }
  })
})
