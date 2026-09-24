import { MailboxDeliveryKindEnum } from './models/mailbox-delivery.enums'

export interface DeliverToMailboxInput {
  /**
   * Chosen by the caller, e.g. one per company per notice per period. A repeat
   * call with the same key resumes the same delivery instead of starting a
   * second one. Reusing a key for a different company or kind is a conflict.
   */
  idempotencyKey: string
  kind: MailboxDeliveryKindEnum
  companyId: string
  /** The document's title in One and in the mailbox. */
  subject: string
  /**
   * Renders the PDF. Called only when a document still has to be created in
   * One, so a resume past CreateDocument never renders.
   */
  pdf: () => Promise<Buffer>
  /** CreateDocument `CreateDate`. Defaults to now in One. */
  createDate?: Date
}

/**
 * - `DISABLED`: `ONESYSTEMS_ENABLED` is not `'true'`. Nothing was written,
 *   rendered or sent.
 * - `SENT`: One confirmed the send. `alreadySent` is true when an earlier call
 *   had done it and this one made no call to One.
 * - `UNCERTAIN`: an earlier call's outcome is unknown (or a crash mid-call was
 *   found just now). Needs a person to check One before anything is repeated.
 * - `IN_PROGRESS`: another worker holds the delivery's lease. Nothing was done.
 *
 * A failure during this call is not a result: it is recorded on the row
 * (FAILED or UNCERTAIN) and the error is rethrown.
 */
export type DeliverToMailboxResult =
  | { status: 'DISABLED' }
  | {
      status: 'SENT'
      deliveryId: string
      islandIsDocumentId: string
      sentAt: Date | null
      alreadySent: boolean
    }
  | { status: 'UNCERTAIN'; deliveryId: string }
  | { status: 'IN_PROGRESS'; deliveryId: string }

/**
 * Delivers a notice to a company's island.is Stafrænt pósthólf through One:
 * CreateCase, CreateDocument, SendDocToIslandIs.
 *
 * Resumable and safe to call again with the same `idempotencyKey`: each id One
 * returns is saved as it arrives, and a repeat skips every step whose id is
 * saved. State is written outside any ambient transaction, so a caller's
 * rollback cannot erase a record of something One has already done. Because of
 * that the company must already be committed: call it from a cron or after
 * commit, not inside the transaction that created the company.
 */
export interface IMailboxDeliveryService {
  deliverToMailbox(
    input: DeliverToMailboxInput,
  ): Promise<DeliverToMailboxResult>
}

// Token for DI, based on https://stackoverflow.com/a/70088972
export const IMailboxDeliveryService = Symbol('IMailboxDeliveryService')
