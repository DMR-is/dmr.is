/**
 * Lifecycle of one custom-email batch.
 *
 *   QUEUED    → recipients resolved and written; nothing sent yet. The state the
 *               request returns in, because the send runs after the commit.
 *   SENDING   → the loop is walking the recipient rows.
 *   COMPLETED → the loop finished. Says nothing about whether every message was
 *               delivered — that lives per recipient, and a batch where every
 *               single send failed still completes.
 *   FAILED    → the loop itself could not run or aborted, e.g. the attachments
 *               could not be read or the database went away mid-batch. Distinct
 *               from COMPLETED-with-failures, which is a normal outcome.
 *
 * ⚠️ A batch left in SENDING is the signature of a container that restarted
 * mid-send. Its PENDING recipient rows are the ones that never went out, which
 * is what makes that state recoverable rather than merely visible.
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
 * string because they are different problems with different fixes: NO_EMAIL is
 * missing data an admin can go and enter, QUARANTINED is a deliberate halt that
 * is working as intended. Collapsing them would make the first invisible inside
 * the second.
 */
export enum CompanyEmailRecipientStatusEnum {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
  SKIPPED_NO_EMAIL = 'SKIPPED_NO_EMAIL',
  SKIPPED_QUARANTINED = 'SKIPPED_QUARANTINED',
}

