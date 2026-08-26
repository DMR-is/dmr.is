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
  // ⚠️ `!== false`, NOT `=== true`. The question this answers is *did we withhold
  // a lágmarksmengi*, and we withhold one only when the company is over the
  // benchmark. `oskyrtWithinBenchmark` is `null` when no gap is computable — a
  // single-gender workforce, say — and in that state there IS no lágmarksmengi to
  // withhold, so the population is everyone.
  //
  // Reading `=== true` put those snapshots in EXCLUDING_MINIMUM_SET, which both
  // surfaces skip before they ever look at `blockers` — so GAP_NOT_COMPUTABLE
  // rendered nowhere and the section silently vanished on the one report that most
  // needed an explanation. See the spec that pins the population per state.
  const population =
    snapshot.oskyrtWithinBenchmark !== false
      ? PayDispersionPopulationEnum.ALL_EMPLOYEES
      : PayDispersionPopulationEnum.EXCLUDING_MINIMUM_SET

  const blockers = blockersFor(snapshot)

  if (blockers.length > 0) {
    return {
      available: false,
      blockers,
      population,
      threshold: PAY_DISPERSION_THRESHOLD,
      cohortResidualSpreadPercentUp: null,
      cohortResidualSpreadPercentDown: null,
      employees: [],
    }
  }

  const spread = residualSpread(snapshot.employees, snapshot.employees.length)

  const eligible =
    population === PayDispersionPopulationEnum.ALL_EMPLOYEES
      ? () => true
      : (employee: WageGapEmployeeSnapshot) => !employee.inMinimumSet

  // ⚠️ Rounded BEFORE the comparison, not after. Filtering on the raw value and
  // publishing a 2dp one makes the list unreproducible at the boundary: |t| =
  // 1,996 would be excluded while displaying as 2,00, and 2,004 included while
  // displaying the same. A reader checking our arithmetic against the printed
  // column would find two rows they cannot account for. One rounding, one number.
  const employees = studentizedResiduals(snapshot)
    .map((row) => ({
      ...row,
      studentizedResidual: round2(row.studentizedResidual),
    }))
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
    // ⚠️ TWO figures, because one would be a lie. The spread is symmetric in log
    // space (±s) and asymmetric once converted to percent: `exp(s) − 1` upward is
    // always larger in magnitude than `exp(−s) − 1` downward — +19,55/−16,35 on
    // the reference cohort, +25,67/−20,43 on richSheetCompliant, a 3–5pp gap.
    //
    // A single field printed as "±19,55%" tells an employee sitting 18% BELOW
    // expected that they are inside the company's spread when they are outside it.
    cohortResidualSpreadPercentUp:
      spread === null ? null : round2((Math.exp(spread) - 1) * 100),
    cohortResidualSpreadPercentDown:
      spread === null ? null : round2((Math.exp(-spread) - 1) * 100),
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
  // ⚠️ Optional-chained, and `!fit` rather than `fit === null`. A snapshot with
  // `pooledFit` ABSENT (an undefined key rather than a JSON null) passed the
  // strict check and then threw on `.xSumSquares` below — and because this runs
  // inside `ReportResultModel.fromModel`, the single mapping path for every
  // report-result read, that TypeError would 500 the whole report-detail response
  // rather than degrading one advisory section. Nothing upstream catches it:
  // `application.service.ts` catches only `NotFoundException`.
  if (
    !snapshot.oskyrtAvailable ||
    !snapshot.pooledFit ||
    !snapshot.employees?.length
  ) {
    return [PayDispersionBlockerEnum.GAP_NOT_COMPUTABLE]
  }

  // ⚠️ Fail CLOSED on a malformed snapshot rather than reporting all-clear. A
  // row frozen by an older engine, or one hand-written by a seeder, can carry
  // employees without a finite `residualLog` — and `undefined ** 2` is NaN, which
  // makes the spread NaN, which lands in the same "no spread" branch as a
  // PERFECT fit. Those two states must not share an answer: one means nobody
  // deviates, the other means we cannot tell.
  // ⚠️ The FIT is in this gate too, not just the employees. `studentizedResiduals`
  // returns `[]` when `xMean` is null — but by then `available: true` has already
  // been committed, so the response published a false all-clear: the one path in a
  // deliberately fail-closed function that failed OPEN.
  if (
    !Number.isFinite(snapshot.pooledFit.xMean) ||
    !Number.isFinite(snapshot.pooledFit.xSumSquares) ||
    // ⚠️ EVERY number `toEmployeeDto` publishes, not only the two the statistic
    // reads. `round2(null)` is `0`, not `NaN` — so an `expectedHourlyWage` of
    // null would print "væntanlegt tímakaup 0 kr./klst." on the document of
    // record instead of a blocker. Same fail-open class the fit clauses above
    // were added to close.
    !snapshot.employees.every((employee) =>
      [
        employee.residualLog,
        employee.score,
        employee.hourlyWage,
        employee.expectedHourlyWage,
        employee.deviationPercent,
      ].every(Number.isFinite),
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
 *
 * ⚠️ Symmetric about zero. `Math.round` breaks ties toward `+∞`, so a bare
 * `Math.round(-2.005 * 100) / 100` gives `-2` while `+2.005` gives `2.01` — the
 * same magnitude printing two different figures depending on sign. Nothing is
 * dropped either way (the filter and the display share this rounding), but a
 * published column should not tell an underpaid and an overpaid employee
 * different things about the same distance from the line.
 *
 * ⚠️ Do NOT feed this a possibly-null value. `Math.round(null * 100) / 100` is
 * `0`, not `NaN`, so a missing figure would publish as a real one — a null
 * `expectedHourlyWage` printing "0 kr./klst." on the document of record. The
 * guarantee lives in `blockersFor`, which gates every field this rounds on
 * `Number.isFinite` and returns GAP_NOT_COMPUTABLE instead; that is deliberately
 * a blocker rather than a dash, because a row we cannot state is not a row.
 */
const round2 = (value: number): number =>
  Math.sign(value) * (Math.round(Math.abs(value) * 100) / 100)
