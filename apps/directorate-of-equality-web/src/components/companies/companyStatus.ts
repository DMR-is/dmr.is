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
  const isSmall = company.employeeCountCategory === CompanySizeEnum.SMALL

  if (needsSalary && hasSalary) return 'compliant' // LARGE: both reports filed
  if (needsSalary && hasEquality) return 'missing-salary' // LARGE: equality done, salary missing
  if (needsSalary) return 'missing-equality' // LARGE: equality is the prerequisite
  // No salary requirement below this line
  if (!isSmall && hasEquality) return 'compliant' // MEDIUM with equality: obligation met
  if (!isSmall) return 'missing-equality' // MEDIUM without equality
  if (hasEquality) return 'has-equality' // SMALL voluntary submission
  return 'compliant' // SMALL with nothing: no obligation
}
