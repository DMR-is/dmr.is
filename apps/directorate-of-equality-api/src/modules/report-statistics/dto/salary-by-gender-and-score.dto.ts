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
  adjustedSalary!: number

  @ApiEnum(GenderEnum)
  gender!: GenderEnum
}

export class RegressionLineDto {
  @ApiNumber()
  slope!: number

  @ApiNumber()
  intercept!: number
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

  /**
   * Half the configured salary-difference threshold (e.g. 1.95 for a 3.9%
   * threshold) — the allowed +/- band around the regression prediction that
   * defines an outlier. Only populated for the base-salary-by-total-score
   * chart, where the outlier rule applies; `null` for the other charts.
   */
  @ApiOptionalNumber({ nullable: true })
  allowedDifferencePercent!: number | null
}
