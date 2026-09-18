/**
 * The flat row shapes the two exports are built from.
 *
 * Deliberately plain types rather than DTOs: nothing here crosses the API
 * boundary as JSON — the only thing that leaves is a file — so these exist to
 * give the column accessors something exhaustive to read, not to be
 * serialised.
 */

import type { CompanyDto } from '../../company/dto/company.dto'
import type {
  CompanySectorEnum,
  CompanySizeEnum,
} from '../../company/models/company.enums'
import type { WageGapDirectionEnum } from '../../report/lib/wage-gap-decomposition'
import type {
  CommunicationStatusEnum,
  EqualityCoverageSourceEnum,
  GenderEnum,
  ReportStatusEnum,
  ReportTypeEnum,
  SalaryDataBasisEnum,
} from '../../report/models/report.enums'

/**
 * Submitted headcount for a company, lifted off its most recent APPROVED
 * report.
 *
 * The company row carries only a bucket (`employeeCountCategory`), so this is
 * the only real number in the system — and it is what "how many people are
 * covered by a jafnlaunakerfi" has to be summed from. `reportedAt` travels
 * with it because a headcount with no date is not a fact anyone can check.
 *
 * Absent for a company that has never had a report approved, which is not the
 * same as a company with zero employees.
 */
export type CompanyEmployeeCounts = {
  male: number | null
  female: number | null
  neutral: number | null
  total: number | null
  reportedAt: Date | null
}

export type CompanyExportRow = {
  company: CompanyDto
  /** Resolved from `company.postcodeId`; null when the company has no postcode. */
  postcode: string | null
  place: string | null
  region: string | null
  employeeCounts: CompanyEmployeeCounts | null
}

export type ReportExportRow = {
  id: string
  identifier: string | null
  type: ReportTypeEnum
  status: ReportStatusEnum
  communicationStatus: CommunicationStatusEnum
  equalitySource: EqualityCoverageSourceEnum

  companyName: string | null
  companyNationalId: string | null
  companyEmployeeCountCategory: CompanySizeEnum | null
  companySector: CompanySectorEnum | null
  companyIsatSection: string | null
  companyIsatDescription: string | null
  postcode: string | null
  region: string | null

  createdAt: Date | null
  approvedAt: Date | null
  validUntil: Date | null
  correctionDeadline: Date | null
  reviewerName: string | null
  includesImprovementPlan: boolean

  companyAdminName: string | null
  companyAdminGender: GenderEnum | null
  contactName: string | null
  contactEmail: string | null

  // --- Salary reports only; every field below is null on an equality plan. ---
  salaryDataPeriod: string | null
  salaryDataBasis: SalaryDataBasisEnum | null
  counts: { male: number; female: number; excluded: number } | null
  meanHourlyWageMale: number | null
  meanHourlyWageFemale: number | null
  rawGapPercent: number | null
  rawGapDirection: WageGapDirectionEnum | null
  oskyrtPercent: number | null
  oskyrtDirection: WageGapDirectionEnum | null
  benchmarkPercent: number | null
  /**
   * ⚠️ The compliance verdict as the server computed it, on the UNROUNDED log
   * gap. Carried through rather than re-derived from `oskyrtPercent` above:
   * comparing a rounded percentage to a rounded benchmark disagrees with it at
   * the boundary, and this column is the one an admin would act on.
   *
   * Tri-state. Null means no gap was computable (a single-gender workforce has
   * no measurable gap, which is not a gap of 0%), and must not collapse to
   * false.
   */
  oskyrtWithinBenchmark: boolean | null
  minimumSetSize: number | null
  calculationVersion: string | null
}
