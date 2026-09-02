import {
  ApiArray,
  ApiBoolean,
  ApiDtoArray,
  ApiEnum,
  ApiNumber,
  ApiOptionalNumber,
} from '@dmr.is/decorators'

import { PayStatusEnum } from '../../report/lib/wage-gap-decomposition'
import { GenderEnum } from '../../report/models/report.enums'

/**
 * Why an ábendingar list could not be produced. Mirrors the
 * `oskyrtAvailable` / `oskyrtBlockers` pair on the decomposition so consumers
 * render a reason rather than an empty table — an empty list with no blocker is
 * a genuine all-clear and must read differently from "not assessable".
 */
export enum PayDispersionBlockerEnum {
  /**
   * The decomposition itself produced nothing to work from — a single-gender
   * workforce returns `employees: []` and `pooledFit: null`, so there is no
   * fitted line and therefore no expected pay to deviate from.
   *
   * Returned ALONE: it subsumes the other two, and a list of three codes
   * describing one absence reads as three problems.
   */
  GAP_NOT_COMPUTABLE = 'GAP_NOT_COMPUTABLE',
  /**
   * Fewer analysed employees than the statistic can support. Not a policy
   * choice: an internally studentized residual is bounded by `√(n − 2)`, so the
   * threshold is arithmetically unreachable on a small workforce. See
   * `PAY_DISPERSION_MIN_COHORT`.
   */
  COHORT_TOO_SMALL = 'COHORT_TOO_SMALL',
  /**
   * Every starfsmatsstig identical, so no slope is identifiable and væntanlegt
   * tímakaup is just the cohort mean. Deviating from a mean is a different claim
   * from deviating from what your stig imply, and only the second is what this
   * instrument reports.
   *
   * ⚠️ The gap decomposition treats this condition as a soft WARNING
   * (`WageGapWarningEnum.NO_SCORE_VARIATION`, óskýrt collapses to the raw gap).
   * Here it is a hard blocker. Same condition, different consequence.
   */
  NO_SCORE_VARIATION = 'NO_SCORE_VARIATION',
}

/**
 * Which employees were eligible for the list.
 *
 * ⚠️ **Not a filter on the statistic.** Every analysed employee is in the fitted
 * line, the residual spread and their own `studentizedResidual` regardless of
 * this value. It says only who may be PRINTED.
 */
export enum PayDispersionPopulationEnum {
  /**
   * The company is within the benchmark, so it has no lágmarksmengi and every
   * analysed employee was eligible.
   */
  ALL_EMPLOYEES = 'ALL_EMPLOYEES',
  /**
   * The company is over the benchmark. Members of the lágmarksmengi are withheld
   * because they are already named in the úrbótaáætlun with a reason and an
   * action attached, and one person must not appear in two tables under two
   * different framings. Everyone else — including gap carriers the selection walk
   * did not pick — remains eligible.
   */
  EXCLUDING_MINIMUM_SET = 'EXCLUDING_MINIMUM_SET',
}

/**
 * One ábending — an employee whose pay sits further from the fitted line than
 * the spread of this company's own data accounts for.
 *
 * ⚠️ **Carries no obligation.** This is deliberately NOT
 * `SalaryAnalysisOutlierDto`: there is no group, no `reason`, no `action`, no
 * signature, and no `contributionShare`. That last omission is the load-bearing
 * one — `contributionShare` answers *"why are you on the úrbótaáætlun"*, and
 * putting it here would import exactly the framing this list exists to avoid.
 */
export class PayDispersionEmployeeDto {
  @ApiNumber()
  employeeOrdinal!: number

  @ApiEnum(GenderEnum)
  gender!: GenderEnum

  @ApiNumber()
  score!: number

  @ApiNumber({ description: 'Raun reglulegt tímakaup (kr./klst.).' })
  regularHourlyWage!: number

  @ApiNumber({
    description:
      'Væntanlegt tímakaup at this score, from the same pooled log fit every other figure on the report is measured against.',
  })
  expectedHourlyWage!: number

  @ApiNumber({
    description: 'frávik %: (raun − væntanlegt) / væntanlegt × 100. Signed.',
  })
  deviationPercent!: number

  @ApiEnum(PayStatusEnum)
  payStatus!: PayStatusEnum

  @ApiNumber({
    description:
      "Signed studentized residual: the employee's residual divided by the cohort's residual spread, leverage-corrected. |t| >= the reported threshold is why this row is listed. NOT a percentage and not comparable to deviationPercent — it is a count of spreads.",
  })
  studentizedResidual!: number
}

/**
 * **Ábendingar** — the informational counterpart to the úrbótaáætlun.
 *
 * The lágmarksmengi answers *"who carries the company's gender pay gap"*. This
 * answers a different question — *"whose pay is far from what their
 * starfsmatsstig imply"* — over the same data and with a **different
 * consequence**: none. No explanation is requested, nothing is submitted, no
 * reviewer acts on it, and it can never be a basis for rejection.
 *
 * It exists because óskýrt is a difference in cohort *mean* residuals, so
 * offsetting residuals inside one cohort cancel exactly. A company can be well
 * within the benchmark while individuals sit a long way off the line, and the
 * statutory instrument is silent about them — correctly, because there is no
 * gender gap to report. "Compliant" means *no aggregate gender gap*, not *no
 * individual pay problems*.
 *
 * ⚠️ **Derived on read, never stored.** Computed from
 * `report_result.wage_gap_decomposition_snapshot` — `employees[].residualLog`,
 * `employees[].score` and `pooledFit` — so it works on every frozen v3 snapshot
 * and needed no schema change. That is deliberate: an advisory rule must stay
 * tunable without rewriting history, while a regulatory figure must not. It is
 * also reproducible by anyone holding the published JSON.
 */
export class PayDispersionDto {
  @ApiBoolean({
    description:
      'False when no list could be produced; `blockers` says why. An empty `employees` array with `available: true` and no blockers is a genuine all-clear and must not be rendered as "not assessed".',
  })
  available!: boolean

  @ApiArray({
    enum: PayDispersionBlockerEnum,
    isArray: true,
    description:
      'Codes only — the web maps these to Icelandic copy. Empty when available.',
  })
  blockers!: PayDispersionBlockerEnum[]

  @ApiEnum(PayDispersionPopulationEnum, {
    description:
      '⚠️ CLIENTS: render a LIST only for ALL_EMPLOYEES. EXCLUDING_MINIMUM_SET is computed and shipped so the contract is ready, but has not been requested yet — do NOT render its rows. ⚠️ Gate on the list, not on the section: when `available` is false there are no rows to withhold, so render the `blockers` reason whatever the population says. Otherwise a company over the benchmark and under the 12-employee floor is shown nothing at all. Both DMR surfaces do exactly this. This field describes which employees were eligible for the list; it does NOT change how the statistic was computed.',
  })
  population!: PayDispersionPopulationEnum

  @ApiNumber({
    description:
      'The |studentizedResidual| cut-off applied, in spreads. 2 today.',
  })
  threshold!: number

  @ApiOptionalNumber({
    nullable: true,
    description:
      "The cohort's own residual spread, UPWARD, in percent — exp(s) − 1. Context for the reader: it is why the cut-off is not a fixed percentage. Typically 19–26% on real workforces, which is why a fixed 20%-off-expected rule flags a third of a workforce. WARNING: do NOT render this as a symmetric plus-or-minus — the spread is symmetric in log space and asymmetric in percent, so pair it with cohortResidualSpreadPercentDown. Null when not available.",
  })
  cohortResidualSpreadPercentUp!: number | null

  @ApiOptionalNumber({
    nullable: true,
    description:
      'The same spread DOWNWARD, in percent — exp(-s) − 1, so always negative and always smaller in magnitude than the upward figure (+19,55% / −16,35% on a real cohort). Exists so a surface can state the band honestly instead of printing one end with a plus-or-minus in front of it. Null when not available.',
  })
  cohortResidualSpreadPercentDown!: number | null

  /**
   * ⚠️ **The union of two per-direction shortlists, NOT a global top-N.** Rows
   * below expected come first, then rows above expected, each block ordered by
   * `|studentizedResidual|` descending with `employeeOrdinal` breaking ties. Do
   * not "fix" this into a single global sort: the cap is applied per direction,
   * so a global sort would silently reorder blocks away from the rendered order
   * and make the array disagree with both surfaces.
   *
   * ⚠️ **Capped.** Use `countBelowExpected` / `countAboveExpected` for how many
   * employees actually qualified — never `employees.length`.
   */
  @ApiDtoArray(PayDispersionEmployeeDto)
  employees!: PayDispersionEmployeeDto[]

  @ApiNumber({
    description:
      'How many employees qualified BELOW expected pay, before any cap. This is the figure to print; `employees` is a shortlist and its length is not this number. Zero when unavailable.',
  })
  countBelowExpected!: number

  @ApiNumber({
    description:
      'How many employees qualified ABOVE expected pay, before any cap. Zero when unavailable.',
  })
  countAboveExpected!: number

  @ApiOptionalNumber({
    nullable: true,
    description:
      "CONTEXT ONLY — never a filter. The familywise critical value z(0,05 / 2n): the distance past which chance alone would rarely put ANY of this company's employees. It grows with headcount (3,5 at 120 employees, 4,6 at 10 000) because screening more people produces more extremes, and it exists so a reader can tell a long list on a large workforce from a real finding. ⚠️ Do NOT filter rows on it: `threshold` decides membership. Null when no list could be produced.",
  })
  chanceCriticalSpreads!: number | null

}
