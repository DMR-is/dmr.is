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
 * Membership means: *the fewest underpaid members of the disadvantaged gender
 * whose correction brings óskýrt (leiðréttur launamunur) under the statutory
 * benchmark.*
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
 * Two further consequences worth knowing before writing copy against this:
 *
 * - **It is lift-only.** Candidates are underpaid members of the disadvantaged
 *   gender, so the set can never propose cutting anyone's pay. Overpaid staff
 *   are never members — under the band they were flagged just as loudly.
 * - **A compliant company flags nobody.** When óskýrt is already under the
 *   benchmark the set is empty, and that is the intended signal rather than an
 *   absence of analysis.
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
 */
export function toMinimumSetDtos(
  snapshot: WageGapDecompositionSnapshot,
): SalaryAnalysisOutlierDto[] {
  // 2dp on rates, not whole krónur. Rounding to 1 kr is 8×10⁻⁷ relative on a
  // 650.000 monthly salary but 2×10⁻⁴ on a ~4.000 kr./klst. rate, and the error
  // compounds when percentages are derived from already-rounded figures.
  const round2 = (value: number): number => Math.round(value * 100) / 100

  return selectMinimumSet(snapshot).map((employee) => ({
    employeeOrdinal: employee.ordinal,
    gender: employee.gender,
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
