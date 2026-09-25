import { DailyCache, RETRY_AFTER_FAILURE_MS } from './daily-cache'

describe('DailyCache', () => {
  let now: Date
  const clock = () => now

  beforeEach(() => {
    now = new Date('2026-09-25T10:00:00Z')
  })

  it('computes once and serves the same value until midnight UTC', async () => {
    const compute = jest.fn().mockResolvedValue('figures')
    const cache = new DailyCache(compute, clock)

    const first = await cache.get()
    now = new Date('2026-09-25T23:59:59Z')
    const second = await cache.get()

    expect(compute).toHaveBeenCalledTimes(1)
    expect(second).toBe(first)
    expect(first.expiresAt).toEqual(new Date('2026-09-26T00:00:00Z'))
  })

  it('recomputes after midnight', async () => {
    const compute = jest.fn().mockResolvedValue('figures')
    const cache = new DailyCache(compute, clock)

    await cache.get()
    now = new Date('2026-09-26T00:00:01Z')
    await cache.get()

    expect(compute).toHaveBeenCalledTimes(2)
  })

  it('shares one computation between concurrent misses', async () => {
    let resolve!: (value: string) => void
    const compute = jest.fn(() => new Promise<string>((r) => (resolve = r)))
    const cache = new DailyCache(compute, clock)

    const calls = [cache.get(), cache.get(), cache.get()]
    resolve('figures')
    const results = await Promise.all(calls)

    expect(compute).toHaveBeenCalledTimes(1)
    expect(results.map((r) => r.value)).toEqual([
      'figures',
      'figures',
      'figures',
    ])
  })

  it('passes the computation the time it started', async () => {
    const compute = jest.fn().mockResolvedValue('figures')
    await new DailyCache(compute, clock).get()

    expect(compute).toHaveBeenCalledWith(now)
  })

  it('keeps serving the last value when a refresh fails, and retries later', async () => {
    const compute = jest
      .fn()
      .mockResolvedValueOnce('yesterday')
      .mockRejectedValueOnce(new Error('db down'))
      .mockResolvedValueOnce('today')
    const cache = new DailyCache(compute, clock)

    await cache.get()
    now = new Date('2026-09-26T00:00:01Z')
    const stale = await cache.get()

    expect(stale.value).toBe('yesterday')
    expect(stale.expiresAt).toEqual(
      new Date(now.getTime() + RETRY_AFTER_FAILURE_MS),
    )

    // Within the retry window the stale value is served without recomputing.
    await cache.get()
    expect(compute).toHaveBeenCalledTimes(2)

    now = new Date(now.getTime() + RETRY_AFTER_FAILURE_MS)
    expect((await cache.get()).value).toBe('today')
  })

  it('surfaces the error when there is nothing to fall back on', async () => {
    const compute = jest
      .fn()
      .mockRejectedValueOnce(new Error('db down'))
      .mockResolvedValueOnce('figures')
    const cache = new DailyCache(compute, clock)

    await expect(cache.get()).rejects.toThrow('db down')
    // The failure is not cached: the next request tries again.
    expect((await cache.get()).value).toBe('figures')
  })
})
