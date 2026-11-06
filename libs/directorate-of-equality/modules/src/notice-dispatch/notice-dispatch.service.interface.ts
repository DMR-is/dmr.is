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

/** An outbox row given up as FAILED: ids and our own text only, as above. */
export type FailedNotice = OverdueNotice & {
  /** When the dispatcher gave it up (`processed_at`). */
  failedAt: Date
}

export interface INoticeDispatchService {
  /**
   * Sends the PENDING outbox rows that are due, one at a time, at most
   * `NOTICE_DISPATCH_BATCH_SIZE` per run: never-tried rows first, then the
   * least recently tried. A held row is re-stamped, so it goes to the back.
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

  /**
   * Rows the dispatcher gave up as FAILED within the last
   * `NOTICE_FAILED_ALERT_WINDOW_MS`: out of attempts, no usable recipient, or
   * a mailbox delivery a person must check. Nothing retries them, so the
   * company was not told until a person acts. The window keeps a row a person
   * has already dealt with from being raised forever; a re-driven row is
   * PENDING again and drops out at once. Oldest give-up first, at most
   * `limit`; `total` counts them all. Reads only, outside any transaction.
   */
  findFailedNotices(
    limit: number,
  ): Promise<{ total: number; notices: FailedNotice[] }>
}

export const INoticeDispatchService = Symbol('INoticeDispatchService')
