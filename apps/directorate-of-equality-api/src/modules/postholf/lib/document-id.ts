import { createHmac } from 'node:crypto'

import { CompanyReminderTierEnum } from '../../company/models/company-event.model'
import { ReportTypeEnum } from '../../report/models/report.enums'

/**
 * Pósthólf caps `documentId` at 50 characters, and the id travels in a URL path
 * island.is calls back on — so it has to be short, URL-safe, and derivable.
 *
 * Shape: `DOE-{kind}{tier}-{YYYYMMDD}-{hmac10}`, e.g. `DOE-EQOV-20260301-3f9a1c7b2d`
 * (28 characters, `[A-Za-z0-9-]` only, so it never needs encoding).
 *
 * Three properties the callback depends on:
 *
 *  - **Derivable.** Nothing is stored to map an id back to a notice. A retry
 *    after a failed send re-derives the same id (and therefore the same S3 key),
 *    so retries overwrite rather than duplicate; a new due date mints a new id.
 *  - **Per-sender unique.** Two companies can share a due date, and an equality
 *    and a salary notice can fall on the same one, so both the company and the
 *    kind are load-bearing.
 *  - **No kennitala in the URL.** The Skjalaveita path already carries the
 *    kennitala once; a second copy inside the id would land in access logs,
 *    `LogRequestMiddleware` and APM twice for no benefit. `hmac10` identifies
 *    the company without disclosing it, and the callback re-derives it from the
 *    kennitala in the path rather than trusting the id.
 *
 * The date is `YYYYMMDD` in **UTC**, taken from the same `toISOString()` the
 * reminder task writes into `company_event.reason`. That is what lets the
 * callback match an id back to its issuance event.
 */

/** Two-letter code per report kind. Part of the id, so it must never change. */
const KIND_CODES: Record<ReportTypeEnum, string> = {
  [ReportTypeEnum.EQUALITY]: 'EQ',
  [ReportTypeEnum.SALARY]: 'SA',
}

/**
 * Two-letter code per mailbox tier. Only the mailbox tiers appear here — the
 * email-only tiers never produce a document, so mapping them would be dead
 * code that invites a caller to mint an id for a notice that was never sent.
 */
const TIER_CODES: Partial<Record<CompanyReminderTierEnum, string>> = {
  [CompanyReminderTierEnum.OVERDUE_NOTICE]: 'OV',
  [CompanyReminderTierEnum.FINES_PRECURSOR]: 'FP',
}

const KIND_BY_CODE = new Map(
  Object.entries(KIND_CODES).map(([kind, code]) => [
    code,
    kind as ReportTypeEnum,
  ]),
)

const TIER_BY_CODE = new Map(
  Object.entries(TIER_CODES).map(([tier, code]) => [
    code as string,
    tier as CompanyReminderTierEnum,
  ]),
)

/** `DOE-EQOV-20260301-3f9a1c7b2d` — anchored, so no partial match slips through. */
const DOCUMENT_ID_PATTERN =
  /^DOE-([A-Z]{2})([A-Z]{2})-(\d{4})(\d{2})(\d{2})-([0-9a-f]{10})$/

const HMAC_LENGTH = 10

/**
 * Pósthólf's hard cap on `documentId`. Exported so both the length assertion in
 * `postholf.service.ts` and `document-id.spec.ts` measure against the same
 * number rather than two copies of it.
 */
export const POSTHOLF_DOCUMENT_ID_MAX_LENGTH = 50

export type NoticeDocumentIdParts = {
  reportType: ReportTypeEnum
  tier: CompanyReminderTierEnum
  /** `YYYY-MM-DD`, UTC — the prefix of the `company_event.reason` ISO string. */
  dueDateYmd: string
}

export class UnsupportedNoticeTierError extends Error {
  constructor(tier: CompanyReminderTierEnum) {
    super(`Tier ${tier} does not deliver to the island.is mailbox`)
  }
}

/**
 * UTC `YYYY-MM-DD` for a due date. Deliberately derived from `toISOString()`
 * rather than the local-time getters: the reminder task stores
 * `dueDate.toISOString()` in `company_event.reason`, and the two have to agree
 * or a served document can never be matched back to its issuance event.
 */
export const toDueDateYmd = (dueDate: Date): string =>
  dueDate.toISOString().slice(0, 10)

const companyFingerprint = (nationalId: string, secret: string): string =>
  createHmac('sha256', secret)
    .update(nationalId)
    .digest('hex')
    .slice(0, HMAC_LENGTH)

/**
 * Builds the `documentId` for one notice.
 *
 * @throws UnsupportedNoticeTierError if `tier` is not a mailbox tier.
 */
export const buildNoticeDocumentId = (input: {
  nationalId: string
  reportType: ReportTypeEnum
  tier: CompanyReminderTierEnum
  dueDate: Date
  secret: string
}): string => {
  const tierCode = TIER_CODES[input.tier]
  if (!tierCode) {
    throw new UnsupportedNoticeTierError(input.tier)
  }

  const ymd = toDueDateYmd(input.dueDate).replace(/-/g, '')
  const fingerprint = companyFingerprint(input.nationalId, input.secret)

  return `DOE-${KIND_CODES[input.reportType]}${tierCode}-${ymd}-${fingerprint}`
}

/**
 * Parses a `documentId` back into its parts, or `null` if it is not one of ours.
 *
 * Does **not** authorise anything — the caller must still call
 * `documentIdMatchesCompany` with the kennitala from the request path.
 */
export const parseNoticeDocumentId = (
  documentId: string,
): NoticeDocumentIdParts | null => {
  const match = DOCUMENT_ID_PATTERN.exec(documentId)
  if (!match) return null

  const [, kindCode, tierCode, year, month, day] = match

  const reportType = KIND_BY_CODE.get(kindCode)
  const tier = TIER_BY_CODE.get(tierCode)
  if (!reportType || !tier) return null

  const dueDateYmd = `${year}-${month}-${day}`

  // A syntactically valid but non-existent date (e.g. 20260231) must not pass —
  // it would query for an event that can never exist and read as "not issued"
  // rather than "malformed request".
  const parsed = new Date(`${dueDateYmd}T00:00:00.000Z`)
  if (Number.isNaN(parsed.getTime()) || toDueDateYmd(parsed) !== dueDateYmd) {
    return null
  }

  return { reportType, tier, dueDateYmd }
}

/**
 * True if `documentId`'s fingerprint was derived from `nationalId`.
 *
 * This is the Pósthólf security checklist's "never return a document based on
 * documentId alone" — the kennitala comes from the request path, the fingerprint
 * from the id, and both have to agree before anything is looked up.
 */
export const documentIdMatchesCompany = (
  documentId: string,
  nationalId: string,
  secret: string,
): boolean => {
  const match = DOCUMENT_ID_PATTERN.exec(documentId)
  if (!match) return false

  return match[6] === companyFingerprint(nationalId, secret)
}

/**
 * S3 key for a notice. Namespaced by kennitala so two companies can never
 * collide even if the fingerprint scheme is ever changed.
 */
export const noticeObjectKey = (
  nationalId: string,
  documentId: string,
): string => `notices/${nationalId}/${documentId}.pdf`
