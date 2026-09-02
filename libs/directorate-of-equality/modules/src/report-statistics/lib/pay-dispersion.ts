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

/**
 * How many employees each direction lists before it stops.
 *
 * ⚠️ **A display depth, not a selection rule.** Unlike the retired ±1,95% band
 * and the rejected fixed "20% off expected", this constant decides *nothing*:
 * every qualifying employee is still counted in `countBelowExpected` /
 * `countAboveExpected`, still printed as a total on every surface, and still
 * recomputable from `wageGapDecomposition.employees[]`. It changes how deep the
 * table prints and not who qualifies, which is why it is allowed to be a round
 * number chosen for legibility.
 *
 * Why the list needed one at all: `|t| ≥ 2` flags ~4,6% of ANY workforce, near
 * enough regardless of the data, because the statistic divides by the cohort's
 * own spread. At 120 employees that is 5 rows and reads as insight; at 10 000 it
 * is ~460 rows and reads as noise. Worse, it is ~455 rows when pay is perfectly
 * explained by stig and ~352 when 100 employees are genuinely 5 spreads off —
 * the list gets SHORTER as the problem gets worse, because the anomalies inflate
 * the spread they are measured against.
 *
 * Why 10 and not 5: 4,6% of a workforce exceeds two lists of ten only above
 * n ≈ 430, so at 10 every company below that renders exactly as it did before
 * this cap existed. A cap of 5 would start truncating around n ≈ 220 — reports
 * that read perfectly well today.
 */
export const PAY_DISPERSION_SHORTLIST_SIZE = 10

/**
 * The absolute ceiling on rows per direction — a plain slice, and the only place
 * {@link shortlist} will cut a tie group in half.
 *
 * Needed because the tie extension is otherwise unbounded. Measured: a tie group
 * on the printed value runs to 2–5 rows in ordinary data, and the largest
 * produced in 1.500 simulated cohorts — with discrete scores and gridded wages,
 * i.e. deliberately payroll-like — was **32** at n = 10.000. So this is a guard
 * against a shape we have never observed, not a case we expect.
 *
 * ⚠️ Do NOT reintroduce a special rendering for a group that crosses it. An
 * earlier version summarised such a group in prose instead of tabling it, on the
 * theory that identically-graded workforces routinely tie in bulk. That theory
 * was not evidenced: reaching an exact tie needs the same starfsmatsstig AND the
 * same hourly wage to the aurar, and `hourlyWage` is salary ÷ hours, which varies
 * per person. The prose branch cost two DTO fields, a copy string on two surfaces
 * and a whole class of "employees qualified but no rows were produced" bugs, all
 * to serve a case nobody has seen. If a real filing ever produces one, 50 rows of
 * it is a perfectly readable answer.
 */
export const PAY_DISPERSION_LIST_CEILING = 50

/**
 * Familywise error rate for {@link chanceCriticalSpreads} — the context figure,
 * not a filter.
 */
const CHANCE_ALPHA = 0.05

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
      // ⚠️ Zero, not "unknown". A blocked report has no qualifying employees to
      // count, and a surface reading these before it reads `blockers` must land
      // on the blocker copy rather than on "0 starfsmenn víkja" — which would
      // state an all-clear we have not established.
      countBelowExpected: 0,
      countAboveExpected: 0,
      chanceCriticalSpreads: null,
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
  //
  // ⚠️ The rounding is also what makes the tie grouping in `shortlist` correct —
  // it groups on THIS value, the one that prints. See the note there.
  const qualifying = studentizedResiduals(snapshot)
    .map((row) => ({
      ...row,
      studentizedResidual: round2(row.studentizedResidual),
    }))
    .filter(
      (row) =>
        Math.abs(row.studentizedResidual) >= PAY_DISPERSION_THRESHOLD &&
        eligible(row.employee),
    )

  // ⚠️ Split BEFORE capping, and capped per direction. The two directions mean
  // different things to an employer — underpaid against their stig, and overpaid
  // against them — and a single mixed list buries the first among the second on
  // any workforce big enough to need a cap at all.
  //
  // A shared cap would also let one direction crowd out the other entirely: a
  // company with 40 people above expected and 3 below would print no `below`
  // rows at all under a global top-10.
  const below = shortlist(qualifying.filter((row) => row.studentizedResidual < 0))
  const above = shortlist(qualifying.filter((row) => row.studentizedResidual > 0))

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
    // ⚠️ Below first, then above — matching the order both surfaces render, so a
    // client that does not split the array still reads it in a sensible order.
    // NOT a global sort; see the field docstring.
    employees: [...below.listed, ...above.listed].map(toEmployeeDto),
    // ⚠️ The TRUE totals, before the cap. These are what the surfaces print, and
    // they are the reason a display cap is legitimate at all: nothing is hidden,
    // only undisplayed.
    countBelowExpected: below.total,
    countAboveExpected: above.total,
    chanceCriticalSpreads: chanceCriticalSpreads(snapshot.employees.length),
  }
}

/**
 * One direction's rows, cut to a readable depth without splitting a tie.
 *
 * ⚠️ **Groups on the ROUNDED value** — the one that prints. Grouping on the raw
 * `studentizedResidual` would still split two rows that both print `2,04`
 * because their unrounded values differ in the ninth decimal, which is exactly
 * the defect this rule exists to prevent: two employees shown at the same stated
 * distance from the line, one listed and one not, for a reason no reader can see.
 * The rounding happens in {@link computePayDispersion} before this is called.
 *
 * ⚠️ **Not a micro-optimisation — a plain slice splits an equal in roughly one in
 * three large reports.** Measured on simulated cohorts: 16% at n = 500, 22% at
 * n = 2.000, 29% at n = 10.000, and 17/28/37% once scores are discrete and wages
 * sit on a grid, as real pay steps do. Extending through the tie costs 0,2–0,5
 * rows on average. That is the whole justification for this walk being anything
 * more than `slice(0, 10)`.
 *
 * Whole groups are taken until the shortlist is full, then
 * {@link PAY_DISPERSION_LIST_CEILING} slices whatever came back. A tie group is
 * therefore split only when it crosses 50 on its own, which has not been
 * observed — see that constant.
 *
 * `total` is the count BEFORE any of this. Callers publish it; `listed.length`
 * is not a substitute and must never be used as one.
 */
function shortlist(rows: StudentizedResidual[]): {
  listed: StudentizedResidual[]
  total: number
} {
  // Most extreme first: the reader's question is "who most needs a look".
  // `ordinal` breaks ties so the output is deterministic for one snapshot — the
  // tie grouping below relies on equal values being adjacent, not on their
  // internal order, but a stable order keeps the published JSON reproducible.
  const sorted = [...rows].sort(
    (a, b) =>
      Math.abs(b.studentizedResidual) - Math.abs(a.studentizedResidual) ||
      a.employee.ordinal - b.employee.ordinal,
  )

  const listed: StudentizedResidual[] = []
  let index = 0

  while (index < sorted.length && listed.length < PAY_DISPERSION_SHORTLIST_SIZE) {
    const value = Math.abs(sorted[index].studentizedResidual)

    let end = index
    while (
      end < sorted.length &&
      Math.abs(sorted[end].studentizedResidual) === value
    ) {
      end += 1
    }

    listed.push(...sorted.slice(index, end))
    index = end
  }

  return {
    // The plain slice. Only bites when one tie group alone exceeds the ceiling.
    listed: listed.slice(0, PAY_DISPERSION_LIST_CEILING),
    total: rows.length,
  }
}

/**
 * How far from the line chance alone would put someone in a cohort this size —
 * the familywise critical value `z(α / 2n)` at α = 5%.
 *
 * ⚠️ **CONTEXT ONLY. Never compare a row against this.** `PAY_DISPERSION_THRESHOLD`
 * decides membership; this decides nothing, and wiring it into the filter would
 * empty the list on every fixture we own (the reference cohort's most extreme
 * employee sits at 3,49 against a critical value of 3,53). It is published so a
 * reader can tell a long list on a large workforce from a real finding: screening
 * 10 000 people produces more extremes than screening 120, and `|t| ≥ 2` does not
 * know that.
 *
 * Acklam's rational approximation to the inverse normal CDF, lower tail only —
 * `α / 2n` is at most 0,05/24 ≈ 0,0021 once {@link PAY_DISPERSION_MIN_COHORT} is
 * satisfied, so the central and upper branches are unreachable and deliberately
 * not implemented. Relative error < 1,15 × 10⁻⁹, which is far past what a printed
 * 2dp sentence needs.
 *
 * ⚠️ The normal approximation to an internally studentized residual's null
 * distribution is lax on a small cohort — the exact null is a scaled Beta. That
 * is acceptable *because* this is a sentence and not a gate; it would not be
 * acceptable if this number ever decided a row.
 */
function chanceCriticalSpreads(n: number): number | null {
  if (!Number.isFinite(n) || n < 2) return null

  const tail = CHANCE_ALPHA / (2 * n)
  if (!(tail > 0) || tail >= 0.02425) return null

  const q = Math.sqrt(-2 * Math.log(tail))
  const numerator =
    ((((-7.784894002430293e-3 * q - 3.223964580411365e-1) * q -
      2.400758277161838) *
      q -
      2.549732539343734) *
      q +
      4.374664141464968) *
      q +
    2.938163982698783
  const denominator =
    (((7.784695709041462e-3 * q + 3.224671290700398e-1) * q +
      2.445134137142996) *
      q +
      3.754408661907416) *
      q +
    1

  return round2(Math.abs(numerator / denominator))
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
 * ⚠️ Symmetric about zero — round-half-away-from-zero, not `Math.round`'s
 * half-toward-`+∞`. A bare `Math.round(t * 100) / 100` prints `-2,04` for
 * `t = −2,045` while printing `+2,05` for its mirror: the same distance from the
 * line, two different figures, decided by which side of it the employee sits.
 *
 * ⚠️ **This is not only cosmetic.** An earlier version of this comment said
 * nothing was dropped either way. That was wrong. The filter compares the
 * ROUNDED value against the threshold, so at an exact tie the old rounding also
 * changed MEMBERSHIP:
 *
 * | `t`      | old  | listed at `≥ 2`? | new   | listed? |
 * | -------- | ---- | ---------------- | ----- | ------- |
 * | `+1,995` | 2,00 | yes              | 2,00  | yes     |
 * | `−1,995` | 1,99 | **no**           | −2,00 | yes     |
 *
 * The underpaid row vanished while its overpaid mirror was listed. Reaching that
 * needs `t · 100` to land on an exactly representable `.5`, which no cohort this
 * pipeline can produce does — the spec pins the reachable half, the display
 * asymmetry at `t = ±2,045`.
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
