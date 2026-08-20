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
import { SalaryByGenderAndScoreDto } from './salary-by-gender-and-score.dto'

/**
 * One member of the **lágmarksmengi** — a pay correction the úrbótaáætlun has to
 * account for.
 *
 * ⚠️ Read the contract on `selectMinimumSet` before rendering this: membership
 * is a property of the *set*, not of the employee, and the set is lift-only. The
 * fields below describe the individual, but the reason they are in the list is
 * the company-wide óskýrt figure, not their own deviation.
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
}
