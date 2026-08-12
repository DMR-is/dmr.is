import format from 'date-fns/format'
import startOfMonth from 'date-fns/startOfMonth'
import subMonths from 'date-fns/subMonths'

import { BadRequestException } from '@nestjs/common'

import { SALARY_DATA_PERIOD_MONTHS_BACK } from '@dmr.is/constants'

import { SalaryDataBasisEnum } from '../models/report.enums'

/**
 * The salary-data basis a submittee declares on a SALARY report: either one
 * specific payroll month, or a twelve-month average. Shared by every write path
 * (report-create, the admin/application submit mappers and the draft
 * PATCH/submit) so the rules cannot drift between them.
 *
 * Two rules, everywhere:
 *   - MONTH   → a month is required, stored normalised to the 1st, and it must
 *               fall inside the reporting window (see `normalizeSalaryDataPeriod`).
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
 * The window a declared payroll month must fall in, as canonical `YYYY-MM-01`
 * strings: the current month back through `SALARY_DATA_PERIOD_MONTHS_BACK`
 * months, counting the current one as the first. Both bounds are in canonical
 * form, so they compare correctly as strings.
 *
 * Computed per call rather than at module load — the API is long-running, and a
 * bound frozen at boot would drift out of date after a month of uptime.
 */
function salaryDataPeriodWindow(): { earliest: string; latest: string } {
  const currentMonth = startOfMonth(new Date())

  return {
    earliest: `${format(
      subMonths(currentMonth, SALARY_DATA_PERIOD_MONTHS_BACK - 1),
      'yyyy-MM',
    )}-01`,
    latest: `${format(currentMonth, 'yyyy-MM')}-01`,
  }
}

/**
 * Validates an incoming salary-data period and normalises it to the 1st of the
 * month it names (`YYYY-MM-01`), the canonical stored form. Throws 400 unless
 * the value is a `YYYY-MM-DD` string naming a month inside the reporting window
 * (see `salaryDataPeriodWindow`) — the figures qualify published wage-gap
 * numbers, so a future month or one from a decade ago is a mistake, not data.
 *
 * The day is discarded rather than checked against the month's length: the
 * stored value has month precision, so `2026-02-30` and `2026-02-28` name the
 * same month and there is nothing for the extra strictness to protect.
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
      `salaryDataPeriod "${period}" is not a month of the year with a day in it`,
    )
  }

  const normalized = `${year}-${month}-01`
  const { earliest, latest } = salaryDataPeriodWindow()

  if (normalized > latest) {
    throw new BadRequestException(
      `salaryDataPeriod "${period}" is in the future — the payroll month must have happened (latest is ${latest})`,
    )
  }

  if (normalized < earliest) {
    throw new BadRequestException(
      `salaryDataPeriod "${period}" is older than the ${SALARY_DATA_PERIOD_MONTHS_BACK}-month reporting window (earliest is ${earliest})`,
    )
  }

  return normalized
}

/**
 * Applies the MONTH/AVERAGE rules to a partially-declared basis without
 * requiring one — the drafting case, where the applicant may set the basis in
 * one PATCH and the month in the next.
 *
 * Returns only the keys the caller actually touched, so PATCH semantics survive
 * (an untouched key stays untouched).
 *
 * The rules are applied against the basis the draft *ends up in*, which is why
 * `storedBasis` is required: a PATCH that names only a month while the draft
 * already says AVERAGE must not write that month, or the row lands as
 * `(AVERAGE, <month>)` and the `report_salary_data_period_average_null` CHECK
 * turns a valid partial PATCH into an opaque 500. AVERAGE wins in both
 * directions — declared here or already stored, the month is cleared.
 *
 * Undeclaring the basis (`salaryDataBasis: null`) takes its month with it; a
 * stored month under no basis is not a state anything downstream can read.
 */
export function resolveDraftSalaryDataBasis(
  input: SalaryDataBasisInput,
  storedBasis: SalaryDataBasisEnum | null,
): SalaryDataBasisPatch {
  const patch: SalaryDataBasisPatch = {}

  if (input.salaryDataBasis !== undefined) {
    patch.salaryDataBasis = input.salaryDataBasis ?? null
  }

  // The basis this PATCH leaves the draft in: what it declares, or what is
  // already stored when it does not touch the key.
  const effectiveBasis =
    input.salaryDataBasis !== undefined
      ? (input.salaryDataBasis ?? null)
      : storedBasis

  if (effectiveBasis === SalaryDataBasisEnum.AVERAGE) {
    // A twelve-month average has no month — clear whatever was there.
    patch.salaryDataPeriod = null
  } else if (input.salaryDataBasis === null) {
    // Undeclaring the basis takes its month with it.
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
