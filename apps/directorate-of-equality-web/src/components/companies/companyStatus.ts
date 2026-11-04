import {
  CompanyObligationFilterEnum,
  CompanyObligationStatusEnum,
  CompanyReportStatusEnum,
  CompanySectorEnum,
  CompanySizeEnum,
  CompanyStatusEnum,
  CompanyValidReportFilterEnum,
} from '../../gen/fetch/types.gen'
import { companiesText } from '../../lib/text'

// Icelandic labels + tag colours for the company report status. The status
// itself is computed server-side and returned on `CompanyDto.reportStatus`;
// the same map drives both the list column and the status filter options so
// the displayed value and the filter value always agree.
export const REPORT_STATUS_LABEL: Record<CompanyReportStatusEnum, string> = {
  [CompanyReportStatusEnum.MISSING_EQUALITY_REPORT]: 'Vantar jafnréttisáætlun',
  [CompanyReportStatusEnum.MISSING_SALARY_REPORT]: 'Vantar skýrslugjöf',
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

export const VALID_REPORT_LABEL: Record<CompanyValidReportFilterEnum, string> =
  {
    [CompanyValidReportFilterEnum.VALID_EQUALITY_REPORT]:
      companiesText.validEqualityReport,
    [CompanyValidReportFilterEnum.VALID_ACTION_PLAN]:
      companiesText.validActionPlan,
    [CompanyValidReportFilterEnum.VALID_SALARY_REPORT]:
      companiesText.validSalaryReport,
  }

/**
 * The "Staða" multi-select: the three "Vantar …" states, then their "Gild …"
 * counterparts. One control over two server params (`companyStatus`,
 * `validReport`); every selection ANDs, so split with `splitStatusFilter`.
 *
 * "Fullnægjandi" (SATISFACTORY) is no longer offered; it is still the roll-up
 * value shown on a company.
 */
export const STATUS_FILTER_OPTIONS = [
  ...[
    CompanyReportStatusEnum.MISSING_EQUALITY_REPORT,
    CompanyReportStatusEnum.MISSING_ACTION_PLAN,
    CompanyReportStatusEnum.MISSING_SALARY_REPORT,
  ].map((value) => ({ value, label: REPORT_STATUS_LABEL[value] })),
  ...[
    CompanyValidReportFilterEnum.VALID_EQUALITY_REPORT,
    CompanyValidReportFilterEnum.VALID_ACTION_PLAN,
    CompanyValidReportFilterEnum.VALID_SALARY_REPORT,
  ].map((value) => ({ value, label: VALID_REPORT_LABEL[value] })),
]

const VALID_REPORT_VALUES = new Set<string>(
  Object.values(CompanyValidReportFilterEnum),
)

/** Splits a "Staða" selection into its two server params. */
export const splitStatusFilter = (values: string[]) => ({
  companyStatus: values.filter(
    (v) => !VALID_REPORT_VALUES.has(v),
  ) as CompanyReportStatusEnum[],
  validReport: values.filter((v) =>
    VALID_REPORT_VALUES.has(v),
  ) as CompanyValidReportFilterEnum[],
})

/**
 * Whether the company owes each report. Selections AND together on the server,
 * so contradictory picks (skylda + EKKI skylda) return nothing.
 */
export const OBLIGATION_FILTER_OPTIONS = [
  {
    value: CompanyObligationFilterEnum.EQUALITY_REQUIRED,
    label: companiesText.equalityRequired,
  },
  {
    value: CompanyObligationFilterEnum.SALARY_REQUIRED,
    label: companiesText.salaryRequired,
  },
  {
    value: CompanyObligationFilterEnum.EQUALITY_NOT_REQUIRED,
    label: companiesText.equalityNotRequired,
  },
  {
    value: CompanyObligationFilterEnum.SALARY_NOT_REQUIRED,
    label: companiesText.salaryNotRequired,
  },
]

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
 * The two register toggles under "Fyrirtæki", rendered as checkboxes. Both
 * narrow: "inactive" sends `status=INACTIVE`, "quarantined" `quarantined=true`.
 */
export const VISIBILITY_FILTER_OPTIONS = [
  { value: 'inactive', label: companiesText.showInactive },
  { value: 'quarantined', label: companiesText.showQuarantined },
]

export const EXPIRES_FILTER_OPTIONS = [
  { value: '30d', label: 'Rennur út innan 30 daga' },
  { value: '3m', label: 'Rennur út innan 3 mánaða' },
  { value: 'soon', label: 'Rennur út innan 6 mánaða' },
]

/** The daily-fines toggle under "Staða" — narrows to `finesStarted=true`. */
export const FLAG_FILTER_OPTIONS = [
  { value: 'fines', label: companiesText.showDailyFines },
]

// Ownership sector, derived server-side mostly from the RSK legal form
// (Ráðuneyti is the exception — it is always set by hand, since no legal
// form or ÍSAT code distinguishes a ministry from any other central
// government office). UNKNOWN is offered as its own choice on purpose: it is
// not a synonym for Fyrirtæki, so an admin has to be able to see — and
// count — the companies we have not classified yet rather than have them
// hidden inside another bucket.
export const SECTOR_LABEL: Record<CompanySectorEnum, string> = {
  [CompanySectorEnum.FYRIRTAEKI]: 'Fyrirtæki',
  [CompanySectorEnum.RADUNEYTI]: 'Ráðuneyti',
  [CompanySectorEnum.RIKISADILI]: 'Ríkisaðilar',
  [CompanySectorEnum.SVEITARFELAG]: 'Sveitarfélög',
  [CompanySectorEnum.UNKNOWN]: 'Óflokkað',
}

export const SECTOR_FILTER_OPTIONS = [
  CompanySectorEnum.FYRIRTAEKI,
  CompanySectorEnum.RADUNEYTI,
  CompanySectorEnum.RIKISADILI,
  CompanySectorEnum.SVEITARFELAG,
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
