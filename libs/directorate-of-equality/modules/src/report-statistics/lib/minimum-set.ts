import {
  type WageGapDecompositionSnapshot,
  type WageGapEmployeeSnapshot,
} from '../../report/lib/wage-gap-decomposition'
import { SalaryAnalysisOutlierDto } from '../dto/salary-analysis.response.dto'

/**
 * **Lágmarksmengi** — the employees whose pay corrections the úrbótaáætlun is
 * about, and the single definition of "flagged" now that the ±1,95% band is
 * retired.
 *
 * Membership means: *the fewest employees CARRYING óskýrt whose correction
 * brings it (leiðréttur launamunur) under the statutory benchmark.*
 *
 * Carrying means their framlag shares the sign of óskýrt — the underpaid on the
 * disadvantaged side, and the overpaid on the advantaged side. Both pull the gap
 * open, so both are candidates, and `payStatus` says which a given row is.
 *
 * ⚠️ **This is a property of the SET, not of the person.** The old band was
 * per-employee — `|frávik| ≥ 1,95%` was a fact about one row, answerable
 * without looking at anyone else. Membership here comes from a greedy walk down
 * the correctable employees ordered by contribution, stopping the moment the
 * running gap drops under the benchmark. Two employees on near-identical pay
 * and score can therefore land on opposite sides of the cut, and the honest
 * answer to *"why me and not my colleague?"* is "you carried more of the gap
 * and N corrections were enough" — not anything about that person alone.
 *
 * Three further consequences worth knowing before writing copy against this:
 *
 * - **It runs in both directions, and still prescribes nothing.** A member may
 *   sit above the line as easily as below it. Nothing here proposes cutting
 *   anyone's pay: being listed obliges the employer to supply a reason and an
 *   action, and improvement is demonstrated at company level at the next report.
 *   The counterfactual correction is how the list is CHOSEN, not a payment
 *   instruction. Asked about someone above the line, the likeliest honest answer
 *   is that the job evaluation understates the role — in which case the fix is to
 *   the evaluation and no pay moves at all.
 * - **The two directions are different questions** and must not share one
 *   prompt. `payStatus` carries the direction per row so the copy can branch;
 *   the explanation itself lives on the GROUP, which may span both.
 * - **A compliant company flags nobody.** When óskýrt is already under the
 *   benchmark the set is empty, and that is the intended signal rather than an
 *   absence of analysis. An empty set does NOT imply compliance in the other
 *   direction, though — read `oskyrtWithinBenchmark` for that.
 *
 * ⚠️ **That last point is only half the story, and the other half lives in
 * {@link computePayDispersion}.** "Nobody carries a gender gap" is not "nobody is
 * mispaid": óskýrt is a difference between the cohorts' MEAN deviations, so
 * deviations that offset each other inside one cohort cancel exactly. Ábendingar
 * is the second, informational instrument for that — same data, different
 * question, and no obligation whatsoever. Do not widen this set to cover it; on a
 * compliant company the walk never runs, and on a non-compliant one the pool by
 * definition excludes everyone whose correction would widen the gap.
 */
export function selectMinimumSet(
  snapshot: WageGapDecompositionSnapshot,
): WageGapEmployeeSnapshot[] {
  return snapshot.employees.filter((employee) => employee.inMinimumSet)
}

/** Ordinals of the lágmarksmengi, for the submit-side group guard. */
export function minimumSetOrdinals(
  snapshot: WageGapDecompositionSnapshot,
): number[] {
  return selectMinimumSet(snapshot).map((employee) => employee.ordinal)
}

/**
 * Projects the lágmarksmengi to the wire shape the úrbótaáætlun renders.
 *
 * Shared by every path that surfaces it — the applicant preview, the admin
 * create-flow preview and the draft analysis — because three copies of this
 * mapping is how one screen starts disagreeing with another.
 *
 * `roleTitleByOrdinal` supplies Starf per employee. It is REQUIRED rather than
 * optional on purpose: the decomposition snapshot is a numeric artifact and
 * carries no labels, so an optional lookup would let a new call site compile
 * while returning `roleTitle: null` on every row — silently, and
 * indistinguishably from a genuinely unknown role. Callers that legitimately
 * have no titles pass an empty map and say so.
 */
export function toMinimumSetDtos(
  snapshot: WageGapDecompositionSnapshot,
  roleTitleByOrdinal: ReadonlyMap<number, string | null>,
): SalaryAnalysisOutlierDto[] {
  // 2dp on rates, not whole krónur. Rounding to 1 kr is 8×10⁻⁷ relative on a
  // 650.000 monthly salary but 2×10⁻⁴ on a ~4.000 kr./klst. rate, and the error
  // compounds when percentages are derived from already-rounded figures.
  const round2 = (value: number): number => Math.round(value * 100) / 100

  return selectMinimumSet(snapshot).map((employee) => ({
    employeeOrdinal: employee.ordinal,
    gender: employee.gender,
    roleTitle: roleTitleByOrdinal.get(employee.ordinal) ?? null,
    score: employee.score,
    regularHourlyWage: round2(employee.hourlyWage),
    expectedHourlyWage: round2(employee.expectedHourlyWage),
    deviationPercent: round2(employee.deviationPercent),
    payStatus: employee.payStatus,
    contributionShare:
      employee.contributionShare === null
        ? null
        : round2(employee.contributionShare),
  }))
}
