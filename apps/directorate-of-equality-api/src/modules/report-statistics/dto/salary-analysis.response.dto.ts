import {
  ApiDto,
  ApiDtoArray,
  ApiEnum,
  ApiNumber,
  ApiOptionalNumber,
} from '@dmr.is/decorators'

import { PayStatusEnum } from '../../report/lib/wage-gap-decomposition'
import { GenderEnum } from '../../report/models/report.model'
import { WageGapDecompositionDto } from '../../report-result/dto/report-result.dto'
import { PayDispersionDto } from './pay-dispersion.dto'
import { SalaryByGenderAndScoreDto } from './salary-by-gender-and-score.dto'

/**
 * One member of the **lágmarksmengi** — a pay correction the úrbótaáætlun has to
 * account for.
 *
 * ⚠️ Read the contract on `selectMinimumSet` before rendering this: membership
 * is a property of the *set*, not of the employee, and the set is
 * two-directional. The fields below describe the individual, but the reason they
 * are in the list is the company-wide óskýrt figure, not their own deviation —
 * and `payStatus` decides which question the employer is being asked about them,
 * so it must be rendered rather than assumed.
 *
 * The `direction` / `differencePercent` / `allowedDifferencePercent` /
 * `scoreBucketRange*` fields this class used to carry are gone with the ±1,95%
 * band. Nothing here is compared to a per-employee tolerance any more.
 */
export class SalaryAnalysisOutlierDto {
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
      'Væntanlegt tímakaup at this score, from the pooled log fit — exp(fitted), so a curve in krónur space, not the chart line.',
  })
  expectedHourlyWage!: number

  @ApiNumber({
    description: 'frávik %: (raun − væntanlegt) / væntanlegt × 100. Signed.',
  })
  deviationPercent!: number

  @ApiEnum(PayStatusEnum)
  payStatus!: PayStatusEnum

  @ApiOptionalNumber({
    nullable: true,
    description:
      'Share of óskýrt this employee carries, in percent. Null when óskýrt is 0.',
  })
  contributionShare!: number | null
}

export class SalaryAnalysisResponseDto {
  /**
   * The lágmarksmengi. Named `outliers` for continuity with the úrbótaáætlun
   * endpoints and the `report_employee_outlier` join it feeds — but the
   * membership rule changed completely, so see `SalaryAnalysisOutlierDto`.
   */
  @ApiDtoArray(SalaryAnalysisOutlierDto)
  outliers!: SalaryAnalysisOutlierDto[]

  @ApiDto(SalaryByGenderAndScoreDto)
  regularHourlyWageByScoreAll!: SalaryByGenderAndScoreDto

  /**
   * The same decomposition that gets frozen onto `report_result` at submit,
   * computed over the same rows and rounded with the same precisions — so the
   * leiðréttur launamunur an applicant previews is the figure they submit, not
   * an approximation of it.
   *
   * Reuses `WageGapDecompositionDto` deliberately rather than declaring a
   * preview-shaped twin: two DTOs for one snapshot is how the preview and the
   * persisted result drift apart.
   */
  @ApiDto(WageGapDecompositionDto)
  wageGapDecomposition!: WageGapDecompositionDto

  /**
   * **Ábendingar** — a SECOND instrument over the same data, and a different
   * question: not *who carries the company's gender pay gap* (that is `outliers`
   * above) but *whose pay is far from what their starfsmatsstig imply*.
   *
   * ⚠️ **It asks nothing.** No group, no reason, no action, no signature, no
   * submission. Rendering it beside the úrbótaáætlun's inputs, or with them,
   * misrepresents it — see `PayDispersionDto`, and render only
   * `population: ALL_EMPLOYEES` until DMR says otherwise.
   *
   * Derived from `wageGapDecomposition` above rather than stored, so it needed no
   * schema change and is reproducible from the frozen snapshot.
   */
  @ApiDto(PayDispersionDto, {
    description:
      'ÁBENDINGAR um launadreifingu — a SECOND, informational list over the same data, answering a different question from `outliers` above. `outliers` (the lágmarksmengi) is "who carries the company\'s gender pay gap"; ábendingar is "whose pay is far from what their starfsmatsstig imply". It exists because óskýrður launamunur is a difference between the cohorts MEAN deviations, so deviations that offset each other inside one cohort cancel exactly — a company can be well under 3,9% while individuals sit a long way off the fitted line. ⚠️ IT ASKS NOTHING: never render it with the reason/action/signature inputs the úrbótaáætlun uses, never require it to be filled in, never submit it. The employer owes no explanation for these rows and they cannot affect how the report is decided. ⚠️ Render only population = ALL_EMPLOYEES; EXCLUDING_MINIMUM_SET is shipped so the contract is ready but has not been requested yet — do NOT render it, and confirm with DMR first. Derived from wageGapDecomposition on read, never stored. See docs/launagreining.md §10.',
  })
  payDispersion!: PayDispersionDto
}
