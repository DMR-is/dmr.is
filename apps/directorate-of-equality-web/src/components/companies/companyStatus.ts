import {
  CompanyObligationStatusEnum,
  CompanyReportStatusEnum,
  CompanySectorEnum,
  CompanySizeEnum,
  CompanyStatusEnum,
} from '../../gen/fetch/types.gen'
import { companiesText } from '../../lib/text'

// Icelandic labels + tag colours for the company report status. The status
// itself is computed server-side and returned on `CompanyDto.reportStatus`;
// the same map drives both the list column and the status filter options so
// the displayed value and the filter value always agree.
export const REPORT_STATUS_LABEL: Record<CompanyReportStatusEnum, string> = {
  [CompanyReportStatusEnum.MISSING_EQUALITY_REPORT]: 'Vantar jafnréttisáætlun',
  [CompanyReportStatusEnum.MISSING_SALARY_REPORT]: 'Vantar launagreiningu',
  [CompanyReportStatusEnum.MISSING_ACTION_PLAN]: 'Vantar úrbótaáætlun',
  [CompanyReportStatusEnum.SATISFACTORY]: 'Fullnægjandi',
}

export const REPORT_STATUS_TAG_VARIANT: Record<
  CompanyReportStatusEnum,
  'red' | 'mint' | 'purple' | 'blue'
> = {
  [CompanyReportStatusEnum.MISSING_EQUALITY_REPORT]: 'red',
  [CompanyReportStatusEnum.MISSING_SALARY_REPORT]: 'purple',
  [CompanyReportStatusEnum.MISSING_ACTION_PLAN]: 'blue',
  [CompanyReportStatusEnum.SATISFACTORY]: 'mint',
}

// Priority order — most critical first — matching the server's evaluation
// (see `companyReportStatusCaseSql`): equality, then the action plan, then the
// salary report. The action plan precedes the salary report because a postponed
// report is filed but not approved; getting this order wrong here would show
// the filter in an order the results do not follow.
export const STATUS_FILTER_OPTIONS = [
  CompanyReportStatusEnum.MISSING_EQUALITY_REPORT,
  CompanyReportStatusEnum.MISSING_ACTION_PLAN,
  CompanyReportStatusEnum.MISSING_SALARY_REPORT,
  CompanyReportStatusEnum.SATISFACTORY,
].map((value) => ({ value, label: REPORT_STATUS_LABEL[value] }))

// ---------------------------------------------------------------------------
// Per-obligation columns
//
// The list gives each obligation its own column, so a cell renders
// `CompanyDto.equalityObligationStatus` / `salaryObligationStatus` rather than
// the roll-up `reportStatus`. The roll-up names only the most pressing problem,
// so a company missing both reports would leave the launagreining column empty.
// ---------------------------------------------------------------------------

export const OBLIGATION_STATUS_LABEL: Record<
  CompanyObligationStatusEnum,
  string
> = {
  [CompanyObligationStatusEnum.NOT_REQUIRED]:
    companiesText.obligationNotRequired,
  [CompanyObligationStatusEnum.MISSING]: companiesText.obligationMissing,
  [CompanyObligationStatusEnum.ACTION_PLAN_MISSING]:
    companiesText.obligationActionPlanMissing,
  [CompanyObligationStatusEnum.COVERED]: companiesText.obligationCovered,
}

/**
 * Tag colour per obligation state, or `null` for NOT_REQUIRED.
 *
 * ⚠️ `null` is the point, not an oversight. "Á ekki við" renders as muted text,
 * never as a tag: it is the absence of a state, and it is the single most
 * common value in the launagreining column — every company below 50 employees
 * sits in it. Tagging it would put a badge saying nothing on the majority of
 * rows and drown the states that do need attention.
 */
export const OBLIGATION_STATUS_TAG_VARIANT: Record<
  CompanyObligationStatusEnum,
  'red' | 'mint' | 'purple' | 'dark' | null
> = {
  [CompanyObligationStatusEnum.NOT_REQUIRED]: null,
  [CompanyObligationStatusEnum.MISSING]: 'red',
  [CompanyObligationStatusEnum.ACTION_PLAN_MISSING]: 'dark',
  [CompanyObligationStatusEnum.COVERED]: 'mint',
}

/**
 * Detail-header wording for the same states.
 *
 * ⚠️ Full sentences, unlike `OBLIGATION_STATUS_LABEL`. In the list a bare
 * "Vantar" is complete because the column header supplies the subject; the
 * company header has no column above it, so a row of tags reading
 * "Vantar / Vantar" would name nothing at all.
 *
 * `null` means "render no tag": an obligation the company does not have is not
 * a state worth a badge on its own page. When BOTH are null the header falls
 * back to a single "Ekki lagaskylt" tag, so it is never bare.
 */
export const EQUALITY_DETAIL_LABEL: Record<
  CompanyObligationStatusEnum,
  string | null
> = {
  [CompanyObligationStatusEnum.NOT_REQUIRED]: null,
  [CompanyObligationStatusEnum.MISSING]:
    REPORT_STATUS_LABEL[CompanyReportStatusEnum.MISSING_EQUALITY_REPORT],
  // Unreachable on the equality side — an equality report has no outlier
  // groups and cannot be postponed. Mapped rather than omitted so the record
  // stays exhaustive if that ever changes.
  [CompanyObligationStatusEnum.ACTION_PLAN_MISSING]:
    REPORT_STATUS_LABEL[CompanyReportStatusEnum.MISSING_ACTION_PLAN],
  [CompanyObligationStatusEnum.COVERED]: companiesText.equalityCovered,
}

export const SALARY_DETAIL_LABEL: Record<
  CompanyObligationStatusEnum,
  string | null
> = {
  [CompanyObligationStatusEnum.NOT_REQUIRED]: null,
  [CompanyObligationStatusEnum.MISSING]:
    REPORT_STATUS_LABEL[CompanyReportStatusEnum.MISSING_SALARY_REPORT],
  [CompanyObligationStatusEnum.ACTION_PLAN_MISSING]:
    REPORT_STATUS_LABEL[CompanyReportStatusEnum.MISSING_ACTION_PLAN],
  [CompanyObligationStatusEnum.COVERED]: companiesText.salaryCovered,
}

/**
 * The salary column's MISSING tag is purple, not red, so the two columns are
 * distinguishable at a glance in a row that is missing both. Everything else is
 * shared, so this is expressed as an override rather than a second full map —
 * a second map would drift.
 */
export const SALARY_OBLIGATION_TAG_VARIANT: typeof OBLIGATION_STATUS_TAG_VARIANT =
  {
    ...OBLIGATION_STATUS_TAG_VARIANT,
    [CompanyObligationStatusEnum.MISSING]: 'purple',
  }

/**
 * The two default-on hides, as opt-in reveals.
 *
 * The admin register is a working list of who owes what, so companies that owe
 * nothing ("ekki lagaskylt") and companies off the register are hidden unless
 * asked for. Each value maps to its own boolean server param — the same shape
 * as FLAG_FILTER_OPTIONS below.
 *
 * ⚠️ "Ekki lagaskylt" is NOT "0–24". Some companies under 25 employees are
 * required to report by arrangement, recorded on the company as
 * `salaryReportRequiredOverride`, and they stay visible. The server owns that
 * rule (`notLegallyObligedSql`); do not restate it here.
 */
export const VISIBILITY_FILTER_OPTIONS = [
  { value: 'notObliged', label: companiesText.showNotObliged },
  { value: 'inactive', label: companiesText.showInactive },
]

export const EXPIRES_FILTER_OPTIONS = [
  { value: '30d', label: 'Rennur út innan 30 daga' },
  { value: '3m', label: 'Rennur út innan 3 mánaða' },
  { value: 'soon', label: 'Rennur út innan 6 mánaða' },
]

// Combined boolean flags — each selected value maps to its own boolean server
// param (see CompaniesContainer). Grouped into a single multi-select so the
// filter panel stays compact.
export const FLAG_FILTER_OPTIONS = [
  { value: 'fines', label: 'Dagsektir í gangi' },
  { value: 'overdue', label: 'Skiladagur liðinn' },
  { value: 'quarantined', label: 'Fyrirtæki er í var' },
]

// Ownership sector (private vs government/state), derived server-side from the
// RSK legal form. UNKNOWN is offered as its own choice on purpose: it is not a
// synonym for private, so an admin has to be able to see — and count — the
// companies we have not classified yet rather than have them hidden inside
// another bucket.
export const SECTOR_LABEL: Record<CompanySectorEnum, string> = {
  [CompanySectorEnum.PRIVATE]: 'Almennur markaður',
  [CompanySectorEnum.PUBLIC]: 'Ríki og sveitarfélög',
  [CompanySectorEnum.UNKNOWN]: 'Óflokkað',
}

export const SECTOR_FILTER_OPTIONS = [
  CompanySectorEnum.PRIVATE,
  CompanySectorEnum.PUBLIC,
  CompanySectorEnum.UNKNOWN,
].map((value) => ({ value, label: SECTOR_LABEL[value] }))

// Register lifecycle status — whether the company is on the Directorate's
// authoritative register. A DIFFERENT axis from the report status above, and
// the two must not be conflated in the UI either: a company can be ACTIVE and
// non-compliant, or INACTIVE and have nothing outstanding. Hence "staða í
// skrá" rather than plain "staða", which the detail sidebar already uses for
// the compliance tag.
export const COMPANY_STATUS_LABEL: Record<CompanyStatusEnum, string> = {
  [CompanyStatusEnum.ACTIVE]: 'Virkt',
  [CompanyStatusEnum.INACTIVE]: 'Óvirkt',
}

// Only INACTIVE gets a colour. ACTIVE is the norm — tagging ~1 750 companies
// with a badge that says "normal" is noise, so the list only marks the
// exceptions.
export const COMPANY_STATUS_TAG_VARIANT: Record<
  CompanyStatusEnum,
  'red' | 'blue'
> = {
  [CompanyStatusEnum.ACTIVE]: 'blue',
  [CompanyStatusEnum.INACTIVE]: 'red',
}

export const COMPANY_STATUS_FILTER_OPTIONS = [
  CompanyStatusEnum.ACTIVE,
  CompanyStatusEnum.INACTIVE,
].map((value) => ({ value, label: COMPANY_STATUS_LABEL[value] }))

export const PAGE_SIZE = 10

export const normalizeId = (id: string | null | undefined) =>
  (id ?? '').replace(/[^0-9]/g, '')

export const employeeCountCategoryFromCount = (
  count: number,
): CompanySizeEnum => {
  if (count >= 50) return CompanySizeEnum.LARGE
  if (count >= 25) return CompanySizeEnum.MEDIUM
  return CompanySizeEnum.SMALL
}
