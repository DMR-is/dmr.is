/**
 * Bounds how many callers may hold a slot at once, with a cap on how many may
 * wait for one. Used to gate a workbook's whole time in memory — the download
 * as well as the exceljs parse: a burst of simultaneous uploads would otherwise
 * stack workbooks until the container OOMs. Capping concurrency pins worst-case
 * memory; excess callers queue, and once the queue is full they're rejected
 * fast (mapped to a 503 upstream) rather than piling up.
 *
 * A slot is permission to *hold a workbook*, not permission to parse one. That
 * distinction is why the consumers acquire before calling `fetchWorkbook`
 * rather than after — a queued caller holding its buffer would put the memory
 * outside the bound this class exists to enforce.
 *
 * Two heap figures appear around this code and they are not in conflict:
 * ~350MB is what the real template *measured* at, dominated by the exceljs
 * model for a wide, styled, multi-sheet workbook rather than by the data;
 * ~256MB is the *derived* bound, `MAX_INFLATED_ARCHIVE_BYTES` times exceljs's
 * ~8x retention. The derived number is the one the budget is built from,
 * because it is the one an upload cannot exceed — see
 * `import-upload/archive-budget.ts`. The measured number is the sanity check
 * that it is the right order of magnitude.
 *
 * Pure and framework-free so it's trivially unit-testable — the NestJS mapping
 * to `ServiceUnavailableException` lives in the caller. Consumers inject the
 * shared instance via `PARSE_GATE`; constructing one directly makes a second,
 * unshared gate.
 */
export class SemaphoreQueueFullError extends Error {
  constructor(maxQueued: number) {
    super(`Semaphore queue is full (max ${maxQueued} waiting)`)
    this.name = 'SemaphoreQueueFullError'
  }
}

export class Semaphore {
  private active = 0
  private readonly waiters: Array<() => void> = []

  constructor(
    private readonly maxConcurrent: number,
    private readonly maxQueued: number,
  ) {
    if (maxConcurrent < 1) throw new Error('maxConcurrent must be >= 1')
    if (maxQueued < 0) throw new Error('maxQueued must be >= 0')
  }

  get activeCount(): number {
    return this.active
  }

  get queuedCount(): number {
    return this.waiters.length
  }

  /**
   * Acquire a slot. Resolves to a release function the caller MUST invoke
   * (in a `finally`) exactly once. Throws {@link SemaphoreQueueFullError}
   * immediately when both the active slots and the wait queue are full.
   */
  async acquire(): Promise<() => void> {
    if (this.active < this.maxConcurrent) {
      this.active++
      return this.makeRelease()
    }

    if (this.waiters.length >= this.maxQueued) {
      throw new SemaphoreQueueFullError(this.maxQueued)
    }

    await new Promise<void>((resolve) => this.waiters.push(resolve))
    // Resumed by release(), which hands its slot straight over — `active` is
    // deliberately not re-incremented here (the slot count is unchanged).
    return this.makeRelease()
  }

  private makeRelease(): () => void {
    let released = false
    return () => {
      if (released) return
      released = true
      const next = this.waiters.shift()
      if (next) {
        // Hand the slot directly to the next waiter — active stays constant.
        next()
      } else {
        this.active--
      }
    }
  }
}
