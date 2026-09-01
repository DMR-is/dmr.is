import { Semaphore, SemaphoreQueueFullError } from './semaphore'

/** Resolve on the next microtask so queued acquisitions can settle. */
const tick = () => new Promise<void>((r) => setImmediate(r))

describe('Semaphore', () => {
  /**
   * `< 1` alone was not enough. `NaN < 1` is false, so a `NaN` limit
   * constructed cleanly and then made every `active < maxConcurrent`
   * comparison false — every acquire queued, the queue filled, and the gate
   * shed everything with a 503 rather than throwing at startup. `readInt`
   * keeps that out of the DI path, but the class is constructible directly.
   */
  describe('constructor rejects limits that would wedge it', () => {
    it.each([
      ['NaN concurrency', NaN, 20],
      ['fractional concurrency', 1.5, 20],
      ['zero concurrency', 0, 20],
      ['Infinity concurrency', Infinity, 20],
    ])('rejects %s', (_label, concurrent, queued) => {
      expect(() => new Semaphore(concurrent, queued)).toThrow(/maxConcurrent/)
    })

    it.each([
      ['NaN queue', 2, NaN],
      ['fractional queue', 2, 1.5],
      ['negative queue', 2, -1],
    ])('rejects %s', (_label, concurrent, queued) => {
      expect(() => new Semaphore(concurrent, queued)).toThrow(/maxQueued/)
    })

    /** Zero is a legitimate queue: it sheds instead of waiting. */
    it('accepts a queue of zero', () => {
      expect(() => new Semaphore(1, 0)).not.toThrow()
    })
  })

  it('allows up to maxConcurrent slots without queueing', async () => {
    const s = new Semaphore(2, 10)
    await s.acquire()
    await s.acquire()
    expect(s.activeCount).toBe(2)
    expect(s.queuedCount).toBe(0)
  })

  it('queues callers beyond maxConcurrent and admits them as slots free up', async () => {
    const s = new Semaphore(1, 10)
    const r1 = await s.acquire()

    let secondAcquired = false
    const p2 = s.acquire().then((release) => {
      secondAcquired = true
      return release
    })

    await tick()
    expect(secondAcquired).toBe(false) // still waiting
    expect(s.queuedCount).toBe(1)
    expect(s.activeCount).toBe(1)

    r1() // free the only slot
    const r2 = await p2
    expect(secondAcquired).toBe(true)
    expect(s.activeCount).toBe(1)
    expect(s.queuedCount).toBe(0)
    r2()
    expect(s.activeCount).toBe(0)
  })

  it('rejects immediately once active + queue are both full', async () => {
    const s = new Semaphore(1, 1)
    await s.acquire() // active
    s.acquire() // queued (the 1 allowed waiter) — intentionally not awaited
    await tick()

    await expect(s.acquire()).rejects.toBeInstanceOf(SemaphoreQueueFullError)
    expect(s.activeCount).toBe(1)
    expect(s.queuedCount).toBe(1)
  })

  it('is idempotent per release — double-calling does not over-free slots', async () => {
    const s = new Semaphore(2, 10)
    const r = await s.acquire()
    await s.acquire()
    expect(s.activeCount).toBe(2)
    r()
    r() // second call is a no-op
    expect(s.activeCount).toBe(1)
  })

  it('bounds concurrency under a burst larger than maxConcurrent', async () => {
    const s = new Semaphore(2, 100)
    let running = 0
    let peak = 0

    const task = async () => {
      const release = await s.acquire()
      running++
      peak = Math.max(peak, running)
      await tick()
      running--
      release()
    }

    await Promise.all(Array.from({ length: 20 }, task))
    expect(peak).toBe(2)
    expect(s.activeCount).toBe(0)
    expect(s.queuedCount).toBe(0)
  })
})
