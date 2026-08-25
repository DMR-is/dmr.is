import {
  type WageGapDecompositionSnapshot,
  type WageGapEmployeeSnapshot,
} from '../../report/lib/wage-gap-decomposition'
import {
  PayDispersionBlockerEnum,
  type PayDispersionDto,
  type PayDispersionEmployeeDto,
  PayDispersionPopulationEnum,
} from '../dto/pay-dispersion.dto'

/**
 * How many spreads from the line counts as an ábending.
 *
 * 2 is the conventional regression-diagnostic cut-off, and it is a count of
 * SPREADS rather than a percentage — which is the whole point. Measured on our
 * fixtures the residual spread is 19,5% (reference company) and 26,1%
 * (richSheet) *in krónur*, so a fixed "20% off expected" rule flags 28 of 120
 * and 45 of 100 employees. That is the retired ±1,95% band's failure with a
 * bigger constant. This rule flags 3 and 2.
 */
export const PAY_DISPERSION_THRESHOLD = 2

/**
 * Smallest workforce the statistic is reported on.
 *
 * ⚠️ Not a policy tolerance — an arithmetic one. An internally studentized
 * residual is bounded by `√(n − 2)`, because the residual under test is itself
 * part of the sum of squares it is divided by. So `|t| ≥ 2` is impossible below
 * n = 6 and, up to about n = 10, requires one residual to account for nearly all
 * of SSE. `n − p ≥ 10` with `p = 2` (intercept + slope) is the standard
 * regression-diagnostic floor and lands here.
 *
 * Below this the answer is *"cannot be assessed in a workforce this size"*,
 * which is not the same statement as *"nobody deviates"* — hence
 * {@link PayDispersionBlockerEnum.COHORT_TOO_SMALL} rather than an empty list.
 */
export const PAY_DISPERSION_MIN_COHORT = 12

/** One employee's position relative to the fitted line, in spreads. */
export type StudentizedResidual = {
  employee: WageGapEmployeeSnapshot
  /** Signed. `residualLog / (s · √(1 − h))`. */
  studentizedResidual: number
  /** `h` — how much this employee's own stig pulled the fitted line. */
  leverage: number
}

/**
 * Every analysed employee's residual, restated in units of the cohort's own
 * spread.
 *
 * ```
 * t_i = e_i / (s · √(1 − h_i))
 *   e_i = residualLog_i
 *   s   = √(Σe² / (n − 2))                 the spread
 *   h_i = 1/n + (stig_i − s̄)² / Sxx        leverage
 * ```
 *
 * **Leverage is not decoration.** An employee at either end of the stig range
 * pulls the fitted line toward themselves, which shrinks their own residual and
 * understates how unusual they are. Dividing by `√(1 − h)` undoes that. Our
 * reference cohort spans 417–770 stig, so the correction is material at both
 * ends.
 *
 * ⚠️ **Runs over the WHOLE cohort, always.** Callers that filter the OUTPUT — see
 * {@link computePayDispersion} withholding the lágmarksmengi — must not filter
 * the INPUT. Recomputing `s` on a reduced set shrinks the spread, which pushes
 * new employees over the threshold, which would shrink it again: a cascade with
 * no fixed point. Worse, refitting would move `expectedHourlyWage` and put two
 * different *væntanlegt tímakaup* on one report for one employee.
 *
 * Returns `[]` when the fit or the residual spread does not exist. A spread of
 * zero is a perfect fit, where nobody deviates from anything.
 */
export function studentizedResiduals(
  snapshot: WageGapDecompositionSnapshot,
): StudentizedResidual[] {
  const { employees, pooledFit } = snapshot
  const n = employees.length

  if (!pooledFit || pooledFit.xMean === null || pooledFit.xSumSquares <= 0) {
    return []
  }
  if (n < 3) return []

  const spread = residualSpread(employees, n)
  if (spread === null) return []

  const { xMean, xSumSquares } = pooledFit

  return employees.map((employee) => {
    const leverage = 1 / n + (employee.score - xMean) ** 2 / xSumSquares
    // Guarded rather than assumed: leverage reaches 1 only in degenerate shapes
    // the floor above excludes, but a NaN here would travel silently into a
    // published table.
    const denominator = spread * Math.sqrt(Math.max(0, 1 - leverage))

    return {
      employee,
      studentizedResidual:
        denominator > 0 ? employee.residualLog / denominator : 0,
      leverage,
    }
  })
}

/**
 * `s = √(Σe² / (n − 2))`. Null when there is nothing to divide by, or when the
 * fit is exact.
 */
function residualSpread(
  employees: WageGapEmployeeSnapshot[],
  n: number,
): number | null {
  if (n < 3) return null

  const sumSquares = employees.reduce(
    (total, employee) => total + employee.residualLog ** 2,
    0,
  )
  const spread = Math.sqrt(sumSquares / (n - 2))

  return spread > 0 ? spread : null
}

/**
 * **Ábendingar** — employees whose pay sits further from the fitted line than
 * this company's own spread accounts for.
 *
 * A second instrument over the same data, asking a different question from the
 * lágmarksmengi and carrying a different consequence: **none**. Nothing is
 * requested of the employer, no reviewer acts on it, and it can never be a basis
 * for rejection. It exists because óskýrt is a difference in cohort MEAN
 * residuals — offsetting residuals inside one cohort cancel exactly, so a company
 * can be comfortably within the benchmark while individuals sit a long way off
 * the line.
 *
 * ⚠️ **The lágmarksmengi is withheld from the OUTPUT, never removed from the
 * ANALYSIS.** Its members stay in the fit, in the spread, in the leverage term
 * and in their own `studentizedResidual`; they simply do not get a second row in
 * a second table, having already been named in the úrbótaáætlun with a reason
 * and an action attached.
 *
 * ⚠️ **Withheld on `inMinimumSet`, NOT on `widensGap`.** The set is only the few
 * carriers the selection walk picked — the reference company has 73 carriers and
 * 5 in the set. Filtering on `widensGap` would silence the other 68 and is the
 * likeliest way to get this wrong.
 *
 * The two lists are never compared to each other. Both are measured against the
 * same pooled fit; neither is a baseline for the other.
 */
export function computePayDispersion(
  snapshot: WageGapDecompositionSnapshot,
): PayDispersionDto {
  const population =
    snapshot.oskyrtWithinBenchmark === true
      ? PayDispersionPopulationEnum.ALL_EMPLOYEES
      : PayDispersionPopulationEnum.EXCLUDING_MINIMUM_SET

  const blockers = blockersFor(snapshot)

  if (blockers.length > 0) {
    return {
      available: false,
      blockers,
      population,
      threshold: PAY_DISPERSION_THRESHOLD,
      cohortResidualSpreadPercent: null,
      employees: [],
    }
  }

  const spread = residualSpread(snapshot.employees, snapshot.employees.length)

  const eligible =
    population === PayDispersionPopulationEnum.ALL_EMPLOYEES
      ? () => true
      : (employee: WageGapEmployeeSnapshot) => !employee.inMinimumSet

  const employees = studentizedResiduals(snapshot)
    .filter(
      (row) =>
        Math.abs(row.studentizedResidual) >= PAY_DISPERSION_THRESHOLD &&
        eligible(row.employee),
    )
    // Most extreme first: the reader's question is "who most needs a look".
    .sort(
      (a, b) =>
        Math.abs(b.studentizedResidual) - Math.abs(a.studentizedResidual) ||
        a.employee.ordinal - b.employee.ordinal,
    )
    .map(toEmployeeDto)

  return {
    available: true,
    blockers: [],
    population,
    threshold: PAY_DISPERSION_THRESHOLD,
    // `exp(s) − 1`: the spread restated in krónur terms, so copy can say "the
    // typical spread here is ±19,5%" and the reader understands why the cut-off
    // is not itself a percentage.
    cohortResidualSpreadPercent:
      spread === null ? null : round2((Math.exp(spread) - 1) * 100),
    employees,
  }
}

/**
 * `GAP_NOT_COMPUTABLE` is returned ALONE. It subsumes the other two — a blocked
 * decomposition has no employees, so it is also "too small" and has no score
 * variation — and three codes describing one absence reads as three problems.
 */
function blockersFor(
  snapshot: WageGapDecompositionSnapshot,
): PayDispersionBlockerEnum[] {
  if (
    !snapshot.oskyrtAvailable ||
    snapshot.pooledFit === null ||
    snapshot.employees.length === 0
  ) {
    return [PayDispersionBlockerEnum.GAP_NOT_COMPUTABLE]
  }

  // ⚠️ Fail CLOSED on a malformed snapshot rather than reporting all-clear. A
  // row frozen by an older engine, or one hand-written by a seeder, can carry
  // employees without a finite `residualLog` — and `undefined ** 2` is NaN, which
  // makes the spread NaN, which lands in the same "no spread" branch as a
  // PERFECT fit. Those two states must not share an answer: one means nobody
  // deviates, the other means we cannot tell.
  if (
    !snapshot.employees.every(
      (employee) =>
        Number.isFinite(employee.residualLog) &&
        Number.isFinite(employee.score),
    )
  ) {
    return [PayDispersionBlockerEnum.GAP_NOT_COMPUTABLE]
  }

  const blockers: PayDispersionBlockerEnum[] = []

  if (snapshot.employees.length < PAY_DISPERSION_MIN_COHORT) {
    blockers.push(PayDispersionBlockerEnum.COHORT_TOO_SMALL)
  }
  if (snapshot.pooledFit.xSumSquares <= 0) {
    blockers.push(PayDispersionBlockerEnum.NO_SCORE_VARIATION)
  }

  return blockers
}

function toEmployeeDto(row: StudentizedResidual): PayDispersionEmployeeDto {
  const { employee } = row

  return {
    employeeOrdinal: employee.ordinal,
    gender: employee.gender,
    score: employee.score,
    regularHourlyWage: round2(employee.hourlyWage),
    expectedHourlyWage: round2(employee.expectedHourlyWage),
    deviationPercent: round2(employee.deviationPercent),
    payStatus: employee.payStatus,
    studentizedResidual: round2(row.studentizedResidual),
  }
}

/**
 * 2dp, matching `toMinimumSetDtos` — rounding rates to whole krónur is 2×10⁻⁴
 * relative on a ~4.000 kr./klst. figure, and the error compounds once
 * percentages are derived from it.
 */
const round2 = (value: number): number => Math.round(value * 100) / 100
