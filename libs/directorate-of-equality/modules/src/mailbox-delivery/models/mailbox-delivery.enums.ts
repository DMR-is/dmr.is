/**
 * Which notice a delivery carries. Each kind maps to its own One case type,
 * document classification and island.is category in `mailbox-delivery.kinds.ts`.
 *
 * Mirrors `mailbox_delivery_kind_enum`. A new kind needs an
 * `ALTER TYPE ... ADD VALUE` migration. Since PostgreSQL 12 that may run inside
 * a transaction (as `m-20260511-add-unassigned-event-type.js` does), but the new
 * value cannot be used in the same transaction, so nothing in that migration
 * may insert or compare against it.
 */
export enum MailboxDeliveryKindEnum {
  OVERDUE_NOTICE = 'OVERDUE_NOTICE',
  FINES_PRECURSOR = 'FINES_PRECURSOR',
}

/**
 * How far one delivery has got through One.
 *
 *   PENDING          → row written, nothing sent to One yet.
 *   CASE_CREATED     → One has a case for the company (`one_case_item_id` set).
 *   DOCUMENT_CREATED → the PDF is filed under that case (`one_document_item_id`).
 *   SENT             → One confirmed the send to island.is (`sent_at` set;
 *                      `island_is_document_id` too, unless One confirmed
 *                      without an `ItemID`).
 *   FAILED           → One clearly rejected a call. Safe to retry.
 *   UNCERTAIN        → a call's outcome is unknown: a timeout, a 5xx, a
 *                      `Success: false`, a success with no usable id, or a
 *                      crash mid-call. Never retried automatically, because
 *                      repeating CreateDocument or SendDocToIslandIs could
 *                      file or send a second copy. No code path leaves it; a
 *                      person reconciles it (see the module README).
 *
 * Resume is driven by which ids are saved (and `sent_at`), not by this column:
 * a FAILED row that already has `one_document_item_id` resumes at the send.
 * The CHECK constraints only guarantee that a forward status never outruns its
 * ids.
 */
export enum MailboxDeliveryStatusEnum {
  PENDING = 'PENDING',
  CASE_CREATED = 'CASE_CREATED',
  DOCUMENT_CREATED = 'DOCUMENT_CREATED',
  SENT = 'SENT',
  FAILED = 'FAILED',
  UNCERTAIN = 'UNCERTAIN',
}

/**
 * The non-idempotent call a delivery is in the middle of, written just before
 * the call and cleared once its outcome is recorded. Still set when the row is
 * next claimed means the process died mid-call, so the row becomes UNCERTAIN.
 *
 * CreateCase has no marker: One finds-or-creates the case, so repeating it is
 * safe.
 */
export enum MailboxDeliveryStepEnum {
  CREATE_DOCUMENT = 'CREATE_DOCUMENT',
  SEND_DOC_TO_ISLAND_IS = 'SEND_DOC_TO_ISLAND_IS',
}
