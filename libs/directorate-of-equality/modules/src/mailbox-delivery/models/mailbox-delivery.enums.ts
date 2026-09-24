/**
 * Which notice a delivery carries. Each kind maps to its own One case type,
 * document classification and island.is category in `mailbox-delivery.kinds.ts`.
 *
 * Mirrors `mailbox_delivery_kind_enum`. A new kind needs a bare
 * `ALTER TYPE ... ADD VALUE` migration, which cannot run inside a transaction.
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
 *   SENT             → One confirmed the send to island.is
 *                      (`island_is_document_id` and `sent_at` set).
 *   FAILED           → One clearly rejected a call. Safe to retry.
 *   UNCERTAIN        → a call's outcome is unknown: a timeout, a 5xx, a success
 *                      with no id, or a crash mid-call. Never retried
 *                      automatically, because repeating CreateDocument or
 *                      SendDocToIslandIs could file or send a second copy.
 *
 * Resume is driven by which ids are saved, not by this column: a FAILED row
 * that already has `one_document_item_id` resumes at the send. The CHECK
 * constraints only guarantee that a forward status never outruns its ids.
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
