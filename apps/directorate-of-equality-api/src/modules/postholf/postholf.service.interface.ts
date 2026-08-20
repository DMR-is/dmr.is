import { CompanyReminderTierEnum } from '../company/models/company-event.model'
import { ReportTypeEnum } from '../report/models/report.enums'

/** Everything Skjalatilkynning needs to register one document reference. */
export type RegisterNoticeInput = {
  /** Recipient — the company's kennitala. */
  nationalId: string
  /** Derived by `buildNoticeDocumentId`, so a retry reuses the same id. */
  documentId: string
  reportType: ReportTypeEnum
  tier: CompanyReminderTierEnum
  /** The deadline the notice is about. */
  dueDate: Date
  /** When the notice was issued — the event's `createdAt` on a retry, never `now()`. */
  documentDate: Date
}

/**
 * Outcome of one `POST /api/v1/documentindexes` item.
 *
 * Pósthólf answers `200` with a per-item array carrying its own `success` flag,
 * so a transport-level success says nothing about delivery. Callers must branch
 * on `success` — that is the whole reason this is not `Promise<void>`.
 */
export type RegisterNoticeResult = {
  success: boolean
  /** Pósthólf's own messages, verbatim, when `success` is false. */
  errors: string[]
  /**
   * The recipient has opted into paper delivery. A legal opt-out: nothing in the
   * DoE model records it, so it is logged and surfaced rather than swallowed.
   */
  wantsPaper: boolean
}

export interface IPostholfService {
  /**
   * True if the recipient has opted into paper delivery. Checked before
   * registering, so a paper-only recipient is never announced electronically and
   * then discovered after the fact.
   */
  wantsPaper(nationalId: string): Promise<boolean>

  /** Registers one document reference. Returns Pósthólf's per-item outcome. */
  registerNotice(input: RegisterNoticeInput): Promise<RegisterNoticeResult>

  /**
   * Withdraws a document that should not have been sent. The mailbox entry
   * disappears; the local `company_event` row does not (it is immutable), so a
   * withdrawal is recorded by the caller, not here.
   */
  withdrawNotice(
    nationalId: string,
    documentId: string,
    reason: string,
  ): Promise<RegisterNoticeResult>

  /**
   * Pósthólf's own `category` vocabulary. Not used at runtime — this exists so
   * the placeholder in `postholf.constants.ts` can be replaced with a real value
   * once credentials exist.
   */
  getCategories(): Promise<string[]>

  /** Pósthólf's own `type` vocabulary. See `getCategories`. */
  getTypes(): Promise<string[]>
}

// Token for DI, based on https://stackoverflow.com/a/70088972
export const IPostholfService = Symbol('IPostholfService')
