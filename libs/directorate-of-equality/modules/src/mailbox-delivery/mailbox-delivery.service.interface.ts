import { MailboxDeliveryKindEnum } from './models/mailbox-delivery.enums'

export interface DeliverToMailboxInput {
  /**
   * One per company per notice per period: build it with
   * `buildMailboxDeliveryIdempotencyKey`. A repeat call with the same key
   * resumes the same delivery instead of starting a second one. A key that
   * does not start with `mailbox-delivery:v1:<kind>:<companyId>:` for this
   * call's own `kind` and company is refused before anything is written.
   *
   * This key is the only guard against a duplicate send. Never mint a new one
   * to "retry" an UNCERTAIN delivery: that starts a second delivery of a notice
   * that may already be in the mailbox (see the module README).
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
 *   had done it and this one made no call to One. `islandIsDocumentId` is null
 *   when One confirmed the send without an `ItemID` (the spec allows it).
 * - `UNCERTAIN`: a call's outcome is unknown (an earlier one, a crash mid-call
 *   found just now, or a late reply saved into a row already UNCERTAIN). Needs
 *   a person to check One before anything is repeated; see the module README.
 * - `IN_PROGRESS`: another worker holds the delivery's lease, or its call
 *   finished while this one was claiming the row. Nothing was sent by this
 *   call; the next call resumes from the saved ids.
 *
 * A failure during this call is not a result: it is recorded on the row
 * (FAILED or UNCERTAIN) and the error is rethrown.
 */
export type DeliverToMailboxResult =
  | { status: 'DISABLED' }
  | {
      status: 'SENT'
      deliveryId: string
      islandIsDocumentId: string | null
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
 * returns is logged and saved as it arrives, and a repeat skips every step
 * whose result is saved. State is written outside any ambient transaction, so
 * a caller's rollback cannot erase a record of something One has already done.
 * Because of that the company must already be committed: call it from a cron
 * or after commit, not inside the transaction that created the company.
 *
 * Callers must deliver SEQUENTIALLY: await one delivery before starting the
 * next. Every state write takes its own pool connection (`transaction: null`)
 * and returns it at once, so one delivery holds at most one connection at a
 * time. Calling it while holding a transaction, such as the repo's cron lock
 * (`pg_try_advisory_xact_lock` inside `sequelize.transaction()`), is allowed:
 * it costs one extra pool connection (two in use, of `max: 5`), and none of
 * these writes is part of that transaction or rolled back with it. Deliveries
 * running in parallel each take one more, and can exhaust the pool.
 *
 * Gated by `ONESYSTEMS_ENABLED`: the OneSystems client itself is not, so this
 * service is where the kill switch lives.
 *
 * CreateCase is repeated after any failure on the assumption that One
 * finds-or-creates the case (TODO(OneSystems): unconfirmed). If it does not, a
 * retry leaves an orphan case in One, never a second send; a case id that
 * loses the race to be saved is logged.
 */
export interface IMailboxDeliveryService {
  deliverToMailbox(
    input: DeliverToMailboxInput,
  ): Promise<DeliverToMailboxResult>
}

// Token for DI, based on https://stackoverflow.com/a/70088972
export const IMailboxDeliveryService = Symbol('IMailboxDeliveryService')
