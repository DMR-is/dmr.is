import { BadRequestException } from '@nestjs/common'

import { SalaryDataBasisEnum } from '../models/report.enums'

/**
 * The salary-data basis a submittee declares on a SALARY report: either one
 * specific payroll month, or a twelve-month average. Shared by every write path
 * (report-create, the admin/application submit mappers and the draft
 * PATCH/submit) so the rules cannot drift between them.
 *
 * Two rules, everywhere:
 *   - MONTH   → a month is required, stored normalised to the 1st.
 *   - AVERAGE → no month applies; any value supplied is cleared.
 *
 * The stored value has month precision, so a caller may send any day within the
 * month it means — the day is normalised away rather than rejected, and the
 * canonical `YYYY-MM-01` string is what reads back out.
 */
export type SalaryDataBasisInput = {
  salaryDataBasis?: SalaryDataBasisEnum | null
  salaryDataPeriod?: string | null
}

export type SalaryDataBasisFields = {
  salaryDataBasis: SalaryDataBasisEnum
  salaryDataPeriod: string | null
}

/**
 * The subset of the pair a single draft PATCH writes. A key that is absent was
 * not touched by the caller; `null` clears the column.
 */
export type SalaryDataBasisPatch = {
  salaryDataBasis?: SalaryDataBasisEnum | null
  salaryDataPeriod?: string | null
}

/** `YYYY-MM-DD` — any day is accepted, the day component is normalised away. */
const PERIOD_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/

/**
 * Validates an incoming salary-data period and normalises it to the 1st of the
 * month it names (`YYYY-MM-01`), the canonical stored form. Throws 400 on
 * anything that is not a real calendar date in `YYYY-MM-DD` form.
 */
export function normalizeSalaryDataPeriod(period: string): string {
  const match = PERIOD_PATTERN.exec(period.trim())
  if (!match) {
    throw new BadRequestException(
      `salaryDataPeriod must be an ISO date of the form YYYY-MM-DD, got "${period}"`,
    )
  }

  const [, year, month, day] = match
  const monthNumber = Number(month)
  const dayNumber = Number(day)

  if (monthNumber < 1 || monthNumber > 12 || dayNumber < 1 || dayNumber > 31) {
    throw new BadRequestException(
      `salaryDataPeriod "${period}" is not a valid calendar date`,
    )
  }

  return `${year}-${month}-01`
}

/**
 * Applies the MONTH/AVERAGE rules to a partially-declared basis without
 * requiring one — the drafting case, where the applicant may set the basis in
 * one PATCH and the month in the next.
 *
 * Returns only the keys the caller actually touched, so PATCH semantics survive
 * (an untouched key stays untouched). Setting the basis to AVERAGE always
 * writes `salaryDataPeriod: null` alongside it, so switching away from MONTH
 * cannot leave a stale month behind.
 */
export function resolveDraftSalaryDataBasis(
  input: SalaryDataBasisInput,
): SalaryDataBasisPatch {
  const patch: SalaryDataBasisPatch = {}

  if (input.salaryDataBasis !== undefined) {
    patch.salaryDataBasis = input.salaryDataBasis ?? null
  }

  if (input.salaryDataBasis === SalaryDataBasisEnum.AVERAGE) {
    // A twelve-month average has no month — clear whatever was there.
    patch.salaryDataPeriod = null
  } else if (input.salaryDataPeriod !== undefined) {
    patch.salaryDataPeriod = input.salaryDataPeriod
      ? normalizeSalaryDataPeriod(input.salaryDataPeriod)
      : null
  }

  return patch
}

/**
 * The submit-time gate for a SALARY report: the basis must be declared, and a
 * MONTH basis must name its month. Returns the pair to persist — the month
 * normalised to the 1st for MONTH, null for AVERAGE.
 */
export function resolveSalaryDataBasis(
  input: SalaryDataBasisInput,
): SalaryDataBasisFields {
  const basis = input.salaryDataBasis ?? null

  if (!basis) {
    throw new BadRequestException(
      'salaryDataBasis is required on a salary report — declare whether the data is based on a specific month (MONTH) or a twelve-month average (AVERAGE)',
    )
  }

  if (basis === SalaryDataBasisEnum.AVERAGE) {
    return { salaryDataBasis: basis, salaryDataPeriod: null }
  }

  if (!input.salaryDataPeriod) {
    throw new BadRequestException(
      'salaryDataPeriod is required when salaryDataBasis is MONTH — state which month the salary data is based on',
    )
  }

  return {
    salaryDataBasis: basis,
    salaryDataPeriod: normalizeSalaryDataPeriod(input.salaryDataPeriod),
  }
}
