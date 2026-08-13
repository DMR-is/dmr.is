import {
  CompanyReportStatusEnum,
  CompanySectorEnum,
  CompanySizeEnum,
} from '../../gen/fetch/types.gen'

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

// Priority order — most critical first — matching the server's evaluation.
export const STATUS_FILTER_OPTIONS = [
  CompanyReportStatusEnum.MISSING_EQUALITY_REPORT,
  CompanyReportStatusEnum.MISSING_SALARY_REPORT,
  CompanyReportStatusEnum.MISSING_ACTION_PLAN,
  CompanyReportStatusEnum.SATISFACTORY,
].map((value) => ({ value, label: REPORT_STATUS_LABEL[value] }))

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
