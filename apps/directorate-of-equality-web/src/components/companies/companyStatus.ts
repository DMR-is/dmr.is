import {
  type CompanyDto,
  CompanySizeEnum,
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
  { value: CompanySizeEnum.SMALL, label: '0–24' },
  { value: CompanySizeEnum.MEDIUM, label: '25–49' },
  { value: CompanySizeEnum.LARGE, label: '50+' },
]

export const COMPANY_SIZE_LABEL: Record<CompanySizeEnum, string> = {
  [CompanySizeEnum.SMALL]: '0–24',
  [CompanySizeEnum.MEDIUM]: '25–49',
  [CompanySizeEnum.LARGE]: '50+',
}

export const STATUS_FILTER_OPTIONS = (
  ['missing-equality', 'has-equality', 'missing-salary', 'compliant'] as const
).map((value) => ({ value, label: STATUS_LABEL[value] }))

export const EXPIRES_FILTER_OPTIONS = [
  { value: '30d', label: 'Rennur út innan 30 daga' },
  { value: '3m', label: 'Rennur út innan 3 mánaða' },
  { value: 'soon', label: 'Rennur út innan 6 mánaða' },
]

export const DAILY_FINES_FILTER_OPTIONS = [
  { value: 'active', label: 'Dagsektir í gangi' },
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

  return {
    hasEquality: hasActive('EQUALITY'),
    hasSalary: hasActive('SALARY'),
    needsSalary,
  }
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
