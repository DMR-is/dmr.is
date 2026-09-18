import {
  ApiDto,
  ApiDtoArray,
  ApiEnum,
  ApiNumber,
  ApiOptionalNumber,
} from '@dmr.is/decorators'

import { GenderEnum } from '../../report/models/report.model'

export class ScatterDataPointDto {
  @ApiNumber()
  score!: number

  @ApiNumber()
  regularHourlyWage!: number

  @ApiEnum(GenderEnum)
  gender!: GenderEnum
}

/**
 * The fitted level-space line, for drawing and for printing beside the chart.
 *
 * ⚠️ **All three are nullable, and that matters more now than it used to.** The
 * chart previously coerced a null fit to `0`, which produced a visibly wrong
 * flat line — bad, but self-evidently broken. These figures are now *printed*,
 * and `Hallatala: 0 kr./klst. á stig` reads as a real finding rather than as
 * missing data. Render `—`, never a zero.
 *
 * A fit is null when there are no samples. Note it is NOT null when every score
 * is identical — that returns `slope: 0`, which is a genuine value for a
 * degenerate fit and must not be conflated with "no line".
 */
export class RegressionLineDto {
  @ApiOptionalNumber({
    nullable: true,
    description:
      'kr./klst. per stig. 3dp — the slope dropped from ~1.000 kr/month-per-stig to ~8 kr./klst.-per-stig with the hourly switch, so 2dp would leave only two significant figures.',
  })
  slope!: number | null

  @ApiOptionalNumber({
    nullable: true,
    description:
      'kr./klst. at score 0 — predicted pay for a job no company has, so treat it as "where the line starts" rather than as a wage.',
  })
  intercept!: number | null

  @ApiOptionalNumber({
    nullable: true,
    description:
      'How much of the pay variation the starfsmatsstig actually explain — i.e. how much the line deserves to be trusted. Null when there is no variation to explain.',
  })
  rSquared!: number | null
}

export class ScoreBucketDto {
  @ApiNumber()
  rangeFrom!: number

  @ApiNumber()
  rangeTo!: number

  @ApiOptionalNumber({ nullable: true })
  maleAverageSalary!: number | null

  @ApiOptionalNumber({ nullable: true })
  femaleAverageSalary!: number | null

  @ApiNumber()
  overallAverageSalary!: number

  @ApiOptionalNumber({ nullable: true })
  maleMedianSalary!: number | null

  @ApiOptionalNumber({ nullable: true })
  femaleMedianSalary!: number | null

  @ApiNumber()
  overallMedianSalary!: number

  @ApiOptionalNumber({ nullable: true })
  wageGapPercent!: number | null

  @ApiNumber()
  maleCount!: number

  @ApiNumber()
  femaleCount!: number
}

export class SalaryTotalsDto {
  @ApiNumber()
  maleAverageSalary!: number

  @ApiNumber()
  femaleAverageSalary!: number

  @ApiNumber()
  overallAverageSalary!: number

  @ApiNumber()
  maleMedianSalary!: number

  @ApiNumber()
  femaleMedianSalary!: number

  @ApiNumber()
  overallMedianSalary!: number

  @ApiOptionalNumber({ nullable: true })
  wageGapPercent!: number | null

  @ApiNumber()
  maleCount!: number

  @ApiNumber()
  femaleCount!: number
}

export class SalaryByGenderAndScoreDto {
  @ApiDtoArray(ScatterDataPointDto)
  dataPoints!: ScatterDataPointDto[]

  @ApiDto(RegressionLineDto)
  regressionLine!: RegressionLineDto

  @ApiDtoArray(ScoreBucketDto)
  scoreBuckets!: ScoreBucketDto[]

  @ApiDto(SalaryTotalsDto)
  totals!: SalaryTotalsDto
}
