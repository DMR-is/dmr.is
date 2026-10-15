import { Transaction } from 'sequelize'

export type NoticeDispatchSummary = {
  /** Rows picked up this run. */
  picked: number
  /** Rows that left PENDING this run, whatever the outcome. */
  settled: number
}

/** Ids and our own text only: nothing personal, so it can go in a log line. */
export type OverdueNotice = {
  noticeId: string
  kind: string
  reportId: string
  attempts: number
  /** The dispatcher's own reason the row was last held or failed. */
  lastError: string | null
  createdAt: Date
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

  /**
   * PENDING rows older than `NOTICE_OVERDUE_AFTER_MS` that the dispatcher
   * should have settled by now: held on a document One has filed but not sent
   * with the flag off, held on a kind with no case template with the flag on,
   * or failing on every run. Not the rows that wait by design: a quarantined
   * company's, and receipts while the flag is off. Oldest first, at most
   * `limit`; `total` counts them all. Reads only, outside any transaction.
   */
  findOverdueNotices(
    limit: number,
  ): Promise<{ total: number; notices: OverdueNotice[] }>
}

export const INoticeDispatchService = Symbol('INoticeDispatchService')
