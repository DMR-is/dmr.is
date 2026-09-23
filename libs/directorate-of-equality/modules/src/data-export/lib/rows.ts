/**
 * The flat row shape the company export is built from.
 *
 * Deliberately plain types rather than DTOs: nothing here crosses the API
 * boundary as JSON — the only thing that leaves is a file — so these exist to
 * give the column accessors something exhaustive to read, not to be
 * serialised.
 */

import type { CompanyDto } from '../../company/dto/company.dto'

/**
 * Submitted headcount for a company, lifted off its most recent APPROVED
 * report.
 *
 * The company row carries only a bucket (`employeeCountCategory`), so this is
 * the only real number in the system — and it is what "how many people are
 * covered by a skýrslugjöf" has to be summed from. `reportedAt` travels
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
  /** Name of the company's ÍSAT section; the company list include stops at the leaf. */
  isatSectionDescription: string | null
  employeeCounts: CompanyEmployeeCounts | null
}
