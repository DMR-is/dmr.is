import {
  CompanyReportStatusEnum,
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

export const DAILY_FINES_FILTER_OPTIONS = [
  { value: 'active', label: 'Dagsektir í gangi' },
]

export const OVERDUE_FILTER_OPTIONS = [
  { value: 'overdue', label: 'Skiladagur liðinn' },
]

export const QUARANTINE_FILTER_OPTIONS = [
  { value: 'quarantined', label: 'Fyrirtæki er í var' },
]

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
