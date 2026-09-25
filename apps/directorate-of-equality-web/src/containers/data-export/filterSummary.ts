import type { CompanyFilters } from '../../components/companies/CompanyFilter'
import {
  COMPANY_STATUS_LABEL,
  EXPIRES_FILTER_OPTIONS,
  FLAG_FILTER_OPTIONS,
  REPORT_STATUS_LABEL,
  SECTOR_LABEL,
  VISIBILITY_FILTER_OPTIONS,
} from '../../components/companies/companyStatus'
import type {
  ReportCriteria,
  ReportDateKey,
  ReportDateRanges,
  ReportGapBounds,
} from '../../components/data-export/ReportCriteriaCards'
import {
  ADMIN_GENDER_OPTIONS,
  EQUALITY_SOURCE_OPTIONS,
  IMPROVEMENT_PLAN_OPTIONS,
  REPORT_TYPE_OPTIONS,
  type ReportFilterOption,
} from '../../components/data-export/reportExportOptions'
import type {
  CompanyReportStatusEnum,
  CompanySectorEnum,
  CompanyStatusEnum,
} from '../../gen/fetch'
import { EMPLOYEE_RANGES } from '../../lib/utils'

/**
 * The active filter, in the words the admin saw on screen.
 *
 * Sent along to the export so the workbook's "Um útdráttinn" sheet can record
 * what produced the file. Built here rather than server-side on purpose: the
 * server has codes, and this side has the labels — an ÍSAT leaf reads as
 * "01110" in the database and "Ræktun korns" in the filter panel, and the
 * point of the sheet is to be readable months later by someone who was not
 * the person who ran it.
 *
 * Codes we cannot resolve to a label (ÍSAT, postcode, region) are listed as
 * codes rather than omitted — an incomplete record is still better than a
 * filter line that silently leaves a dimension out.
 *
 * The report half is prefixed and appended by `reportSummary` below. It does
 * NOT restate that only approved filings were considered — that is a property
 * of the export, not of the filter, and belongs in the sheet's own heading
 * rather than repeated on six lines.
 */
const line = (label: string, values: string[]): string | null =>
  values.length ? `${label}: ${values.join(', ')}` : null

export const buildFilterSummary = (
  filters: CompanyFilters,
  criteria: ReportCriteria,
  dates: ReportDateRanges,
  gaps: ReportGapBounds,
  query: string,
): string[] => {
  const labelFor = (
    options: { value: string; label: string }[],
    values: string[],
  ) =>
    values.map(
      (value) => options.find((o) => o.value === value)?.label ?? value,
    )

  return [
    query.trim() ? `Leitarorð: ${query.trim()}` : null,
    line('Starfsmannafjöldi', labelFor(EMPLOYEE_RANGES, filters.employees)),
    line(
      'Staða',
      filters.status.map(
        (value) => REPORT_STATUS_LABEL[value as CompanyReportStatusEnum],
      ),
    ),
    line(
      'Staða í skrá',
      filters.registerStatus.map(
        (value) => COMPANY_STATUS_LABEL[value as CompanyStatusEnum],
      ),
    ),
    line(
      'Rekstrarform',
      filters.sector.map((value) => SECTOR_LABEL[value as CompanySectorEnum]),
    ),
    line('Gildistími', labelFor(EXPIRES_FILTER_OPTIONS, filters.expires)),
    line('Flögg', labelFor(FLAG_FILTER_OPTIONS, filters.flags)),
    line('Sýnileiki', labelFor(VISIBILITY_FILTER_OPTIONS, filters.visibility)),
    line('ÍSAT-bálkur', filters.isatSection),
    line('ÍSAT atvinnugrein', filters.isatCategoryCode),
    line('Landshluti', filters.regionCode),
    line('Póstnúmer', filters.postcode),
    ...reportSummary(criteria, dates, gaps),
  ].filter((value): value is string => value !== null)
}


const DATE_RANGE_LABELS: Array<[string, ReportDateKey, ReportDateKey]> = [
  ['Skýrsla innsend', 'reportSubmittedFrom', 'reportSubmittedTo'],
  ['Skýrsla samþykkt', 'reportApprovedFrom', 'reportApprovedTo'],
  ['Skýrsla gildir til', 'reportValidUntilFrom', 'reportValidUntilTo'],
  ['Launatímabil', 'reportSalaryDataPeriodFrom', 'reportSalaryDataPeriodTo'],
]

const formatDay = (date: Date) =>
  `${String(date.getDate()).padStart(2, '0')}.${String(
    date.getMonth() + 1,
  ).padStart(2, '0')}.${date.getFullYear()}`

/**
 * A date range in the words the panel used.
 *
 * An open-ended range is spelled out ("frá …", "til …") rather than rendered
 * with a dangling dash — the sheet is read months later by someone who did not
 * run the export, and "01.01.2026 –" is ambiguous about whether the other
 * bound was empty or lost.
 */
const dateLine = (
  label: string,
  from: Date | undefined,
  to: Date | undefined,
): string | null => {
  if (from && to) return `${label}: ${formatDay(from)} – ${formatDay(to)}`
  if (from) return `${label}: frá ${formatDay(from)}`
  if (to) return `${label}: til ${formatDay(to)}`
  return null
}

/**
 * A pay-gap range in words.
 *
 * Names the figure in full — "Óleiðréttur" / "Óskýrður" — because the sheet is
 * read by someone who did not run the export, and the two differ by roughly a
 * factor of three on the same company.
 */
const gapLine = (
  label: string,
  from: string | undefined,
  to: string | undefined,
): string | null => {
  if (!from && !to) return null

  const pct = (value: string) => `${value.replace('.', ',')}%`

  if (from && to) return `${label}: ${pct(from)} – ${pct(to)}`
  if (from) return `${label}: ${pct(from)} og yfir`
  return `${label}: að ${pct(to as string)}`
}

/**
 * The report half of the filter, in words.
 *
 * Prefixed "Skýrslur —" throughout because these narrowed the companies rather
 * than describing them: a reader who sees "Tegund: Skýrslugjöf" on a sheet of
 * companies would otherwise reasonably wonder what a company's tegund is.
 */
const reportSummary = (
  criteria: ReportCriteria,
  dates: ReportDateRanges,
  gaps: ReportGapBounds,
): string[] => {
  const labelFor = (
    options: ReportFilterOption[],
    values: string[],
  ): string[] =>
    values.map(
      (value) => options.find((o) => o.value === value)?.label ?? value,
    )

  const prefix = 'Skýrslur — '

  return [
    line(`${prefix}tegund`, labelFor(REPORT_TYPE_OPTIONS, criteria.type)),
    line(
      `${prefix}kyn æðsta stjórnanda`,
      labelFor(ADMIN_GENDER_OPTIONS, criteria.companyAdminGender),
    ),
    line(
      `${prefix}grundvöllur jafnréttisáætlunar`,
      labelFor(EQUALITY_SOURCE_OPTIONS, criteria.equalitySource),
    ),
    line(
      `${prefix}úrbótaáætlun`,
      labelFor(IMPROVEMENT_PLAN_OPTIONS, criteria.improvementPlan),
    ),
    gapLine(
      `${prefix}óleiðréttur launamunur`,
      gaps.reportRawGapPercentFrom,
      gaps.reportRawGapPercentTo,
    ),
    gapLine(
      `${prefix}óskýrður launamunur`,
      gaps.reportOskyrtPercentFrom,
      gaps.reportOskyrtPercentTo,
    ),
    ...DATE_RANGE_LABELS.map(([label, fromKey, toKey]) =>
      dateLine(`${prefix}${label.toLowerCase()}`, dates[fromKey], dates[toKey]),
    ),
  ].filter((value): value is string => value !== null)
}
