import {
  MailboxDeliveryKindEnum,
  MailboxDeliveryStatusEnum,
} from './models/mailbox-delivery.enums'

/**
 * Whether notices go to the island.is mailbox through One. The one reading of
 * `ONESYSTEMS_ENABLED`: `deliverToMailbox` gates on it, and a caller that has
 * an email fallback branches on it.
 */
export const isMailboxDeliveryEnabled = (): boolean =>
  process.env.ONESYSTEMS_ENABLED === 'true'

export interface DeliverToMailboxInput {
  /**
   * One per company per notice per period: build it with
   * `buildMailboxDeliveryIdempotencyKey`. A repeat call with the same key
   * resumes the same delivery instead of starting a second one. A key that
   * is not exactly what `buildMailboxDeliveryIdempotencyKey` returns for this
   * call's own `kind` and company is refused with a throw before anything is
   * written, even while delivery is switched off. A key that merely starts
   * with the right prefix, such as `${prefix}salary-20270301` with a
   * lower-case discriminator, is refused too.
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
 *   rendered or sent. The key is checked first, so a malformed key throws
 *   rather than returning DISABLED.
 * - `UNCONFIGURED`: `kind` has no case template in `mailbox-delivery.kinds.ts`
 *   (`isKindConfigured`). Nothing was written, rendered or sent, and it is
 *   logged at error. Not a failure of this delivery: the caller holds the
 *   notice, uncounted, until the template is set, so switching the flag on
 *   before the templates are confirmed loses nothing. doe-api's daily mailbox
 *   alert names every unconfigured kind while the flag is on.
 * - `QUARANTINED`: the company is quarantined (`company.quarantined`), which
 *   halts every outbound touchpoint. Nothing was written, rendered or sent,
 *   and a delivery already under way is left where it stopped. Call again
 *   with the same key once the quarantine is lifted.
 * - `SENT`: One confirmed the send. `alreadySent` is true when an earlier call
 *   had done it and this one made no call to One. `islandIsDocumentId` is null
 *   when One confirmed the send without a `DocumentId`.
 * - `UNCERTAIN`: a call's outcome is unknown (an earlier one, a crash mid-call
 *   found just now, or a late reply saved into a row already UNCERTAIN). Needs
 *   a person to check One before anything is repeated; see the module README.
 * - `IN_PROGRESS`: another worker holds the delivery's lease, or its call
 *   finished while this one was claiming the row. Nothing was sent by this
 *   call; the next call resumes from the saved ids.
 * - `skipped` set: this call made no call to One, and `status` is the row's
 *   own (`FAILED`, or the forward state it stopped at). The reasons:
 *   - `ATTEMPTS_EXHAUSTED`: the row has been claimed
 *     `MAILBOX_DELIVERY_MAX_ATTEMPTS` times without being sent. Nothing
 *     retries it until a person fixes the cause and resets `attempts` (see
 *     the module README). Logged as an error on every call.
 *
 * A failure during this call is not a result: it is recorded on the row
 * (FAILED or UNCERTAIN) and the error is rethrown.
 */
export type DeliverToMailboxResult =
  | { status: 'DISABLED' }
  | { status: 'UNCONFIGURED'; kind: MailboxDeliveryKindEnum }
  | { status: 'QUARANTINED' }
  | {
      status: 'SENT'
      deliveryId: string
      islandIsDocumentId: string | null
      sentAt: Date | null
      alreadySent: boolean
    }
  | { status: 'UNCERTAIN'; deliveryId: string }
  | { status: 'IN_PROGRESS'; deliveryId: string }
  | {
      status: MailboxDeliveryUnsettledStatus
      deliveryId: string
      attempts: number
      skipped: MailboxDeliverySkipReason
    }

/** Why a delivery was left alone without a call to One. */
export type MailboxDeliverySkipReason = 'ATTEMPTS_EXHAUSTED'

/** A row status that still has work left: neither SENT nor UNCERTAIN. */
export type MailboxDeliveryUnsettledStatus = Exclude<
  MailboxDeliveryStatusEnum,
  MailboxDeliveryStatusEnum.SENT | MailboxDeliveryStatusEnum.UNCERTAIN
>

/** What a caller without the flag needs to know about an existing delivery. */
export type MailboxDeliveryState = {
  deliveryId: string
  status: MailboxDeliveryStatusEnum
  /** One holds the document: `one_document_item_id` is saved. */
  documentFiled: boolean
  /** One confirmed the send: `sent_at` is saved. */
  sent: boolean
  /**
   * A call's marker is still set and its lease has lapsed: the process died
   * mid-call, so whether One acted is unknown, as for UNCERTAIN. The next
   * claim would mark it UNCERTAIN.
   */
  interrupted: boolean
  /** A worker holds a live lease on it and may be calling One right now. */
  inProgress: boolean
  /**
   * Claimed `MAILBOX_DELIVERY_MAX_ATTEMPTS` times without being sent, and no
   * call is under way: nothing retries it until a person re-arms it.
   */
  exhausted: boolean
}

/**
 * Why a delivery needs a person:
 * - `UNCERTAIN`: whether One acted is unknown. Reconcile it against One.
 * - `INTERRUPTED`: a call's marker is still set and its lease has lapsed, so
 *   the process died mid-call. The next call with its key marks it UNCERTAIN;
 *   an outbox row that has already given up never makes that call.
 * - `ATTEMPTS_EXHAUSTED`: claimed `MAILBOX_DELIVERY_MAX_ATTEMPTS` times
 *   without being sent. Fix the cause and re-arm it.
 */
export type StuckMailboxDeliveryReason =
  | 'UNCERTAIN'
  | 'INTERRUPTED'
  | 'ATTEMPTS_EXHAUSTED'

/** Ids and counts only: nothing personal, so it can go in a log line. */
export type StuckMailboxDelivery = {
  deliveryId: string
  kind: MailboxDeliveryKindEnum
  companyId: string
  reason: StuckMailboxDeliveryReason
  attempts: number
  lastAttemptAt: Date | null
}

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
 * CreateCase is repeated after any failure: One finds-or-creates the case
 * (OneSystems, 29 Sep 2026). A case id that loses the race to be saved is
 * logged.
 */
export interface IMailboxDeliveryService {
  deliverToMailbox(
    input: DeliverToMailboxInput,
  ): Promise<DeliverToMailboxResult>

  /**
   * The delivery holding `idempotencyKey`, or null. Reads only, and works
   * whatever `ONESYSTEMS_ENABLED` says: a caller falling back to email uses
   * it to avoid sending a notice One has already filed or sent.
   */
  findDelivery(idempotencyKey: string): Promise<MailboxDeliveryState | null>

  /**
   * The deliveries a person must act on (see `StuckMailboxDeliveryReason`),
   * oldest attempt first, at most `limit`. Reads only, whatever
   * `ONESYSTEMS_ENABLED` says: rows left from before the flag went off still
   * need a person.
   */
  findStuckDeliveries(limit: number): Promise<StuckMailboxDelivery[]>

  /**
   * How many deliveries need a person, by reason, over every row rather than
   * the `limit` that `findStuckDeliveries` names.
   */
  countStuckDeliveries(): Promise<Record<StuckMailboxDeliveryReason, number>>

  /**
   * The kinds in use (`MAILBOX_DELIVERY_KINDS_IN_USE`) with no case template.
   * Each answers `UNCONFIGURED` while the flag is on.
   */
  unconfiguredKinds(): MailboxDeliveryKindEnum[]
}

// Token for DI, based on https://stackoverflow.com/a/70088972
export const IMailboxDeliveryService = Symbol('IMailboxDeliveryService')
