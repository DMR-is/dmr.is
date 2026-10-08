export type NoticeDispatchSummary = {
  /** Rows picked up this run. */
  picked: number
  /** Rows that left PENDING this run, whatever the outcome. */
  settled: number
}

export interface INoticeDispatchService {
  /**
   * Sends the oldest PENDING outbox rows that are due, one at a time.
   *
   * Never throws for a single row: a row's failure is recorded on the row and
   * the run moves on. Throws only when the outbox itself cannot be read.
   */
  dispatchPending(): Promise<NoticeDispatchSummary>
}

export const INoticeDispatchService = Symbol('INoticeDispatchService')
