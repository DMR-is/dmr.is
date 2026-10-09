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
  /** Nothing to send for this kind on this channel (a receipt with mailbox delivery off). */
  SKIPPED = 'SKIPPED',
  /** Gave up: no recipient, the report is gone, or every attempt failed. */
  FAILED = 'FAILED',
}

export enum NoticeOutboxChannelEnum {
  EMAIL = 'EMAIL',
  MAILBOX = 'MAILBOX',
}
