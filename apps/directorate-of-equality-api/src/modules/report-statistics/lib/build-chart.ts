import {
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
  adjustedSalary: number
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
): SalaryByGenderAndScoreDto {
  const dataPoints: ScatterDataPointDto[] = points.map((p) => ({
    score: p.score,
    adjustedSalary: Math.round(p.adjustedSalary),
    gender: p.gender,
  }))

  return {
    dataPoints,
    regressionLine: computeLinearRegression(points),
    scoreBuckets: computeScoreBuckets(points),
    totals: computeTotals(points),
  }
}

function computeLinearRegression(
  points: EmployeeDataPoint[],
): RegressionLineDto {
  const regression = computeSalaryRegression(
    points.map((p) => ({
      score: p.score,
      adjustedBaseSalary: p.adjustedSalary,
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
    salary: point.adjustedSalary,
  }))

  return computeSalaryScoreBucketSnapshots(salaryPoints, SCORE_BUCKET_WIDTH).map(
    (bucket) => {
      const snapshot = bucket.totals

      return {
        rangeFrom: bucket.rangeFrom,
        rangeTo: bucket.rangeTo,
        maleAverageSalary:
          snapshot.male.average !== null
            ? Math.round(snapshot.male.average)
            : null,
        femaleAverageSalary:
          snapshot.female.average !== null
            ? Math.round(snapshot.female.average)
            : null,
        overallAverageSalary: Math.round(snapshot.overall.average ?? 0),
        maleMedianSalary:
          snapshot.male.median !== null
            ? Math.round(snapshot.male.median)
            : null,
        femaleMedianSalary:
          snapshot.female.median !== null
            ? Math.round(snapshot.female.median)
            : null,
        overallMedianSalary: Math.round(snapshot.overall.median ?? 0),
        wageGapPercent: roundNullable(snapshot.salaryDifferences.maleFemale, 1),
        maleCount: bucket.counts.male,
        femaleCount: bucket.counts.female,
      }
    },
  )
}

function computeTotals(points: EmployeeDataPoint[]): SalaryTotalsDto {
  const males = points.filter((point) => point.gender === GenderEnum.MALE)
  const females = points.filter((point) => point.gender === GenderEnum.FEMALE)
  const snapshot = computeSalaryAggregateSnapshot(
    points.map((point) => ({
      gender: point.gender,
      salary: point.adjustedSalary,
    })),
  )

  return {
    maleAverageSalary: Math.round(snapshot.male.average ?? 0),
    femaleAverageSalary: Math.round(snapshot.female.average ?? 0),
    overallAverageSalary: Math.round(snapshot.overall.average ?? 0),
    maleMedianSalary: Math.round(snapshot.male.median ?? 0),
    femaleMedianSalary: Math.round(snapshot.female.median ?? 0),
    overallMedianSalary: Math.round(snapshot.overall.median ?? 0),
    wageGapPercent: roundNullable(snapshot.salaryDifferences.maleFemale, 1),
    maleCount: males.length,
    femaleCount: females.length,
  }
}
