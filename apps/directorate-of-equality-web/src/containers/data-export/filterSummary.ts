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
  ReportDateKey,
  ReportDateRanges,
  ReportFilters,
} from '../../components/data-export/ReportExportFilter'
import {
  COMMUNICATION_STATUS_OPTIONS,
  EQUALITY_SOURCE_OPTIONS,
  REPORT_STATUS_OPTIONS,
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
 */
const line = (label: string, values: string[]): string | null =>
  values.length ? `${label}: ${values.join(', ')}` : null

export const buildFilterSummary = (
  filters: CompanyFilters,
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
  ].filter((value): value is string => value !== null)
}

const DATE_RANGE_LABELS: Array<[string, ReportDateKey, ReportDateKey]> = [
  ['Innsent', 'createdFrom', 'createdTo'],
  ['Samþykkt', 'approvedFrom', 'approvedTo'],
  ['Gildir til', 'validUntilFrom', 'validUntilTo'],
  ['Launatímabil', 'salaryDataPeriodFrom', 'salaryDataPeriodTo'],
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

export const buildReportFilterSummary = (
  filters: ReportFilters,
  dates: ReportDateRanges,
  query: string,
): string[] => {
  const labelFor = (
    options: ReportFilterOption[],
    values: string[],
  ): string[] =>
    values.map(
      (value) => options.find((o) => o.value === value)?.label ?? value,
    )

  return [
    query.trim() ? `Leitarorð: ${query.trim()}` : null,
    line('Tegund', labelFor(REPORT_TYPE_OPTIONS, filters.type)),
    line('Staða', labelFor(REPORT_STATUS_OPTIONS, filters.status)),
    line(
      'Samskiptastaða',
      labelFor(COMMUNICATION_STATUS_OPTIONS, filters.communicationStatus),
    ),
    line(
      'Grundvöllur jafnréttisáætlunar',
      labelFor(EQUALITY_SOURCE_OPTIONS, filters.equalitySource),
    ),
    line(
      'Starfsmannafjöldi',
      filters.employees.map(
        (value) => EMPLOYEE_SIZE_LABEL[value] ?? value,
      ),
    ),
    line(
      'Rekstrarform',
      filters.sector.map((value) => SECTOR_LABEL[value as CompanySectorEnum]),
    ),
    line('ÍSAT-bálkur', filters.isatSection),
    line('ÍSAT atvinnugrein', filters.isatCategoryCode),
    line('Landshluti', filters.regionCode),
    line('Póstnúmer', filters.postcode),
    ...DATE_RANGE_LABELS.map(([label, fromKey, toKey]) =>
      dateLine(label, dates[fromKey], dates[toKey]),
    ),
  ].filter((value): value is string => value !== null)
}

/** Same buckets the report filter offers; see `EMPLOYEE_RANGE_OPTIONS`. */
const EMPLOYEE_SIZE_LABEL: Record<string, string> = {
  SMALL: '0–24',
  MEDIUM: '25–49',
  LARGE: '50+',
  UNKNOWN: 'Óþekkt',
}
