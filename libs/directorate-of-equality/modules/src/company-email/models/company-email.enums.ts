/**
 * Lifecycle of one custom-email batch.
 *
 *   QUEUED    → recipients resolved and written; nothing sent yet.
 *   SENDING   → the loop is walking the recipient rows.
 *   COMPLETED → the loop finished. Says nothing about delivery — that lives per
 *               recipient, and a batch where every send failed still completes.
 *   FAILED    → the loop itself could not run or aborted.
 *
 * A batch left in SENDING is the signature of a container that restarted
 * mid-send; its PENDING rows are the ones that never went out.
 */
export enum CompanyEmailStatusEnum {
  QUEUED = 'QUEUED',
  SENDING = 'SENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

/**
 * What happened to one company within a batch.
 *
 * The two SKIPPED values are separate states rather than one with a reason
 * string: NO_EMAIL is missing data an admin can go and enter, QUARANTINED is a
 * deliberate halt. Collapsing them would hide the first inside the second.
 */
export enum CompanyEmailRecipientStatusEnum {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
  SKIPPED_NO_EMAIL = 'SKIPPED_NO_EMAIL',
  SKIPPED_QUARANTINED = 'SKIPPED_QUARANTINED',
}

