import { CompanyReminderTierEnum } from '../../company/models/company-event.model'
import { ReportTypeEnum } from '../../report/models/report.enums'
import { POSTHOLF_DOCUMENT_ID_MAX_LENGTH } from './document-id'

export const POSTHOLF_LOGGING_CONTEXT = 'PostholfService'
export const POSTHOLF_LOGGING_CATEGORY = 'postholf-service'

/**
 * Pósthólf's `category` and `type` must match its own vocabularies, served by
 * `GET /api/v1/documentindexes/categories` and `GET /api/v1/documentindexes/types`.
 * Those lists are not published in the developer docs and are not in this repo,
 * so both values below are **placeholders**.
 *
 * PLUG IN: fetch both lists once with real credentials, pick the values with
 * Jafnréttisstofa, and replace these two constants. `postholf.service.ts`
 * exposes `getCategories()` / `getTypes()` for exactly that purpose, and
 * `postholf.constants.spec.ts` asserts the length limits Pósthólf enforces
 * (25 characters each) so a wrong value fails locally rather than at the API.
 */
export const POSTHOLF_CATEGORY = 'TODO_CATEGORY'
export const POSTHOLF_TYPE = 'TODO_TYPE'

/** Pósthólf field length limits, asserted before we send rather than after. */
export const POSTHOLF_LIMITS = {
  documentId: POSTHOLF_DOCUMENT_ID_MAX_LENGTH,
  category: 25,
  type: 25,
  subject: 80,
  kennitala: 10,
} as const

/**
 * `minimumAuthenticationType` for a served notice.
 *
 * PLUG IN: Jafnréttisstofa's call. Not obviously `HIGH` — company (lögaðili)
 * mailbox access runs through procuration/delegation, and requiring `HIGH` can
 * make a notice unreadable by the person who has to act on it. `SUBSTANTIAL` is
 * the middle default until they decide.
 */
export const POSTHOLF_MINIMUM_AUTHENTICATION_TYPE = 'SUBSTANTIAL'

/** Icelandic report label, in the genitive the notice copy uses. */
export const reportLabel = (type: ReportTypeEnum): string =>
  type === ReportTypeEnum.SALARY ? 'jafnlaunaskýrslu' : 'jafnréttisskýrslu'

/**
 * Mailbox subject per tier, capped at Pósthólf's 80 characters.
 *
 * Only the two mailbox tiers appear — `Partial` rather than a full `Record`, so
 * adding an email-only tier here is a deliberate act rather than a compiler
 * demand.
 */
export const NOTICE_SUBJECT: Partial<
  Record<CompanyReminderTierEnum, (type: ReportTypeEnum) => string>
> = {
  [CompanyReminderTierEnum.OVERDUE_NOTICE]: (type) =>
    `Áminning: skilafrestur ${reportLabel(type)} er útrunninn`,
  [CompanyReminderTierEnum.FINES_PRECURSOR]: (type) =>
    `Undanfari dagsekta: skil ${reportLabel(type)} hafa ekki borist`,
}
