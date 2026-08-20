import {
  bundleNeutralIntoFemale,
  computeSalaryAggregateSnapshot,
  computeSalaryRegression,
  computeSalaryScoreBucketSnapshots,
  roundNullable,
  type SalaryScorePoint,
  SCORE_BUCKET_WIDTH,
} from '../../report/lib/compensation-aggregates'
import { GenderEnum } from '../../report/models/report.model'
import {
  RegressionLineDto,
  SalaryByGenderAndScoreDto,
  SalaryTotalsDto,
  ScatterDataPointDto,
  ScoreBucketDto,
} from '../dto/salary-by-gender-and-score.dto'

export interface EmployeeDataPoint {
  score: number
  regularHourlyWage: number
  gender: GenderEnum
}

/**
 * Builds the gender-vs-score scatter response shared by reviewer-side
 * statistics endpoints and the application-side salary-analysis preview.
 * Pure function — pass in the already-computed `EmployeeDataPoint[]` and
 * receive the chart payload (data points, regression line, score buckets,
 * totals) ready to return as DTO.
 */
export function buildChartFromEmployeePoints(
  points: EmployeeDataPoint[],
  allowedDifferencePercent: number | null = null,
): SalaryByGenderAndScoreDto {
  const dataPoints: ScatterDataPointDto[] = points.map((p) => ({
    score: p.score,
    // 2dp, not whole krónur: rounding to 1 kr is 8×10⁻⁷ relative on a 650.000
    // monthly salary but 2×10⁻⁴ on a ~4.900 kr./klst. rate, and the error
    // compounds into every percentage derived from these figures.
    regularHourlyWage: roundNullable(p.regularHourlyWage, 2) ?? 0,
    gender: p.gender,
  }))

  return {
    dataPoints,
    regressionLine: computeLinearRegression(points),
    scoreBuckets: computeScoreBuckets(points),
    totals: computeTotals(points),
    allowedDifferencePercent,
  }
}

function computeLinearRegression(
  points: EmployeeDataPoint[],
): RegressionLineDto {
  const regression = computeSalaryRegression(
    points.map((p) => ({
      score: p.score,
      regularHourlyWage: p.regularHourlyWage,
    })),
  )

  return {
    slope: roundNullable(regression.slope, 2) ?? 0,
    intercept: roundNullable(regression.intercept, 2) ?? 0,
  }
}

function computeScoreBuckets(points: EmployeeDataPoint[]): ScoreBucketDto[] {
  const salaryPoints: SalaryScorePoint[] = points.map((point) => ({
    score: point.score,
    gender: point.gender,
    salary: point.regularHourlyWage,
  }))

  return computeSalaryScoreBucketSnapshots(salaryPoints, SCORE_BUCKET_WIDTH).map(
    (bucket) => {
      const snapshot = bucket.totals

      return {
        rangeFrom: bucket.rangeFrom,
        rangeTo: bucket.rangeTo,
        maleAverageSalary:
          snapshot.male.average !== null
            ? roundNullable(snapshot.male.average, 2)
            : null,
        femaleAverageSalary:
          snapshot.female.average !== null
            ? roundNullable(snapshot.female.average, 2)
            : null,
        overallAverageSalary: roundNullable(snapshot.overall.average, 2) ?? 0,
        maleMedianSalary:
          snapshot.male.median !== null
            ? roundNullable(snapshot.male.median, 2)
            : null,
        femaleMedianSalary:
          snapshot.female.median !== null
            ? roundNullable(snapshot.female.median, 2)
            : null,
        overallMedianSalary: roundNullable(snapshot.overall.median, 2) ?? 0,
        wageGapPercent: roundNullable(snapshot.salaryDifferences.maleFemale, 1),
        maleCount: bucket.counts.male,
        femaleCount: bucket.counts.female,
      }
    },
  )
}

function computeTotals(points: EmployeeDataPoint[]): SalaryTotalsDto {
  const males = points.filter(
    (point) => bundleNeutralIntoFemale(point.gender) === GenderEnum.MALE,
  )
  // NEUTRAL is bundled with FEMALE (M vs F+N).
  const females = points.filter(
    (point) => bundleNeutralIntoFemale(point.gender) === GenderEnum.FEMALE,
  )
  const snapshot = computeSalaryAggregateSnapshot(
    points.map((point) => ({
      gender: point.gender,
      salary: point.regularHourlyWage,
    })),
  )

  return {
    maleAverageSalary: roundNullable(snapshot.male.average, 2) ?? 0,
    femaleAverageSalary: roundNullable(snapshot.female.average, 2) ?? 0,
    overallAverageSalary: roundNullable(snapshot.overall.average, 2) ?? 0,
    maleMedianSalary: roundNullable(snapshot.male.median, 2) ?? 0,
    femaleMedianSalary: roundNullable(snapshot.female.median, 2) ?? 0,
    overallMedianSalary: roundNullable(snapshot.overall.median, 2) ?? 0,
    wageGapPercent: roundNullable(snapshot.salaryDifferences.maleFemale, 1),
    maleCount: males.length,
    femaleCount: females.length,
  }
}
