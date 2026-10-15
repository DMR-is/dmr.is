/** Which notice a company is owed. One row per kind per report. */
export enum NoticeOutboxKindEnum {
  REPORT_SUBMITTED = 'REPORT_SUBMITTED',
  REPORT_APPROVED = 'REPORT_APPROVED',
  REPORT_DENIED = 'REPORT_DENIED',
}

export enum NoticeOutboxStatusEnum {
  /** Owed and not yet sent. The dispatcher picks it up. */
  PENDING = 'PENDING',
  /** Sent through `channel`. */
  DONE = 'DONE',
  /**
   * Not sent because it was no longer owed when its turn came: a receipt for
   * a report already decided, superseded or withdrawn, or a decision the
   * report has moved on from (`OWED_WHILE` in the dispatcher). `last_error`
   * names the report's status. Rows written before that rule are receipts
   * settled with mailbox delivery off, which now wait PENDING instead.
   */
  SKIPPED = 'SKIPPED',
  /** Gave up: no recipient, the report is gone, or every attempt failed. */
  FAILED = 'FAILED',
}

export enum NoticeOutboxChannelEnum {
  EMAIL = 'EMAIL',
  MAILBOX = 'MAILBOX',
}
