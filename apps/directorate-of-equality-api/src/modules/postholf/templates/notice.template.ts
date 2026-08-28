import { CompanyReminderTierEnum } from '../../company/models/company-event.model'
import { ReportTypeEnum } from '../../report/models/report.enums'
import { reportLabel } from '../lib/postholf.constants'

/**
 * The two notices served into the island.is mailbox.
 *
 * ⚠️ PLUG IN: the body copy below is **placeholder wording**. These are legal
 * instruments — the final Icelandic text, the statutory references, and the
 * signature block must come from Jafnréttisstofa. The structure, the fields
 * available, and the styling are what this file settles; the sentences are not.
 *
 * Inputs are deliberately narrow. Everything here is either decoded from the
 * `documentId` or is stable company identity, so the rendered document does not
 * drift with data that changes after issuance — see the plan's note on
 * `report-workflow.service.ts` advancing the due date on approval.
 *
 * Follows the `modules/mail/templates/*.template.ts` convention: one exported
 * `Input` type plus pure builders, no service dependencies, local `escapeHtml`.
 */
export type NoticeInput = {
  companyName: string
  companyNationalId: string
  /** Optional — omitted from the letterhead when the company has no address. */
  companyAddress: string | null
  reportType: ReportTypeEnum
  tier: CompanyReminderTierEnum
  /** The deadline that was missed. */
  dueDate: Date
  /** When the notice was issued. Never `now()` on a retry. */
  issueDate: Date
}

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const formatDate = (date: Date): string => {
  const day = String(date.getUTCDate()).padStart(2, '0')
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  return `${day}.${month}.${date.getUTCFullYear()}`
}

const formatNationalId = (nationalId: string): string =>
  `${nationalId.slice(0, 6)}-${nationalId.slice(6)}`

/** Notice heading per tier. */
const NOTICE_HEADING: Partial<Record<CompanyReminderTierEnum, string>> = {
  [CompanyReminderTierEnum.OVERDUE_NOTICE]:
    'Áminning — skilafrestur er útrunninn',
  [CompanyReminderTierEnum.FINES_PRECURSOR]: 'Undanfari dagsekta',
}

/**
 * Body paragraphs per tier. PLACEHOLDER COPY — see the file header.
 * Each entry receives the already-escaped, already-formatted values so the
 * builders below stay free of markup concerns.
 */
const NOTICE_BODY: Partial<
  Record<
    CompanyReminderTierEnum,
    (v: { label: string; due: string; company: string }) => string[]
  >
> = {
  [CompanyReminderTierEnum.OVERDUE_NOTICE]: ({ label, due, company }) => [
    `Skilafrestur ${label} fyrir ${company} rann út ${due} og skil hafa ekki borist Jafnréttisstofu.`,
    'Jafnréttisstofa áminnir hér með um að skilum verði komið í lag án frekari dráttar.',
    'Verði ekki bætt úr getur málið verið tekið til frekari meðferðar, þar á meðal ákvörðunar um dagsektir.',
  ],
  [CompanyReminderTierEnum.FINES_PRECURSOR]: ({ label, due, company }) => [
    `Skilafrestur ${label} fyrir ${company} rann út ${due}. Þrátt fyrir áminningu hafa skil ekki borist.`,
    'Málið hefur verið tekið til frekari meðferðar hjá Jafnréttisstofu.',
    'Þetta erindi er undanfari ákvörðunar um dagsektir.',
  ],
}

const requireTier = <T>(
  map: Partial<Record<CompanyReminderTierEnum, T>>,
  tier: CompanyReminderTierEnum,
  what: string,
): T => {
  const value = map[tier]
  if (!value) {
    // A mailbox tier with no copy would otherwise render a blank legal notice.
    throw new Error(`No notice ${what} defined for tier ${tier}`)
  }
  return value
}

export const buildNoticeHtml = (input: NoticeInput): string => {
  const heading = requireTier(NOTICE_HEADING, input.tier, 'heading')
  const body = requireTier(NOTICE_BODY, input.tier, 'body')

  const company = escapeHtml(input.companyName)
  const paragraphs = body({
    label: reportLabel(input.reportType),
    due: formatDate(input.dueDate),
    company: `<strong>${company}</strong>`,
  })

  const addressLine = input.companyAddress
    ? `<div>${escapeHtml(input.companyAddress)}</div>`
    : ''

  return [
    '<article class="notice">',
    '<header class="notice__header">',
    '<div class="notice__sender">Jafnréttisstofa</div>',
    `<div class="notice__date">${formatDate(input.issueDate)}</div>`,
    '</header>',
    '<section class="notice__recipient">',
    `<div><strong>${company}</strong></div>`,
    `<div>${formatNationalId(input.companyNationalId)}</div>`,
    addressLine,
    '</section>',
    `<h1 class="notice__heading">${escapeHtml(heading)}</h1>`,
    ...paragraphs.map((p) => `<p>${p}</p>`),
    '<footer class="notice__footer">',
    '<p>Jafnréttisstofa</p>',
    '</footer>',
    '</article>',
  ].join('')
}
