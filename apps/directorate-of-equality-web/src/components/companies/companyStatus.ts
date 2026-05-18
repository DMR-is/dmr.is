import {
  type CompanyDto,
  type ReportListItemDto,
} from '../../gen/fetch/types.gen'

export type CompanyStatus =
  | 'missing-equality'
  | 'has-equality'
  | 'missing-salary'
  | 'compliant'

export const STATUS_LABEL: Record<CompanyStatus, string> = {
  'missing-equality': 'Vantar jafnréttisáætlun',
  'has-equality': 'Jafnréttisáætlun virk',
  'missing-salary': 'Vantar launagreiningu',
  compliant: 'Fullnægjandi',
}

export const STATUS_TAG_VARIANT: Record<
  CompanyStatus,
  'red' | 'mint' | 'purple'
> = {
  'missing-equality': 'red',
  'has-equality': 'mint',
  'missing-salary': 'purple',
  compliant: 'mint',
}

export const EMPLOYEE_RANGES = [
  { value: '1-50', label: '1–50' },
  { value: '51-100', label: '51–100' },
  { value: '101-200', label: '101–200' },
  { value: '201+', label: '201+' },
]

export const STATUS_FILTER_OPTIONS = (
  [
    'missing-equality',
    'has-equality',
    'missing-salary',
    'compliant',
  ] as const
).map((value) => ({ value, label: STATUS_LABEL[value] }))

export const EXPIRES_FILTER_OPTIONS = [
  { value: '30d', label: 'Rennur út innan 30 daga' },
  { value: '3m', label: 'Rennur út innan 3 mánaða' },
  { value: 'soon', label: 'Rennur út innan 6 mánaða' },
]

export const DAGSEKTIR_FILTER_OPTIONS = [
  { value: 'active', label: 'Dagsektir í gangi' },
]

export const PAGE_SIZE = 10

export const normalizeId = (id: string | null | undefined) =>
  (id ?? '').replace(/[^0-9]/g, '')

export const inRange = (count: number, range: string): boolean => {
  if (range === '1-50') return count >= 1 && count <= 50
  if (range === '51-100') return count >= 51 && count <= 100
  if (range === '101-200') return count >= 101 && count <= 200
  if (range === '201+') return count >= 201
  return false
}

function getActiveReportTypes(
  company: CompanyDto,
  approvedReports: ReportListItemDto[],
) {
  const now = new Date()
  const companyId = normalizeId(company.nationalId)
  const companyReports = companyId
    ? approvedReports.filter(
        (r) => normalizeId(r.companyNationalId) === companyId,
      )
    : []

  const hasActive = (type: 'EQUALITY' | 'SALARY') =>
    companyReports.some(
      (r) => r.type === type && (!r.validUntil || new Date(r.validUntil) > now),
    )

  const needsSalary =
    company.salaryReportRequired || company.salaryReportRequiredOverride

  return { hasEquality: hasActive('EQUALITY'), hasSalary: hasActive('SALARY'), needsSalary }
}

export function deriveStatus(
  company: CompanyDto,
  approvedReports: ReportListItemDto[],
): CompanyStatus {
  const { hasEquality, hasSalary, needsSalary } = getActiveReportTypes(
    company,
    approvedReports,
  )

  if (needsSalary && hasSalary) return 'compliant'
  if (needsSalary && !hasSalary) return 'missing-salary'
  if (hasEquality) return 'has-equality'
  return 'missing-equality'
}

export function matchesStatusFilter(
  company: CompanyDto,
  approvedReports: ReportListItemDto[],
  filter: string,
): boolean {
  const { hasEquality, hasSalary, needsSalary } = getActiveReportTypes(
    company,
    approvedReports,
  )

  switch (filter) {
    case 'compliant':
      return needsSalary && hasSalary
    case 'missing-salary':
      return needsSalary && !hasSalary
    case 'has-equality':
      return !needsSalary && hasEquality
    case 'missing-equality':
      return !needsSalary && !hasEquality
    default:
      return false
  }
}
