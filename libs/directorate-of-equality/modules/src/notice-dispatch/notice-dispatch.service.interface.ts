import { Transaction } from 'sequelize'

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
   *
   * @param lockTransaction The advisory lock's transaction, which every query
   *   joins through CLS. Each row runs in a savepoint on it, so one row's
   *   database error cannot abort it for the rows after.
   */
  dispatchPending(lockTransaction: Transaction): Promise<NoticeDispatchSummary>
}

export const INoticeDispatchService = Symbol('INoticeDispatchService')
