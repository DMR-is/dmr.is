import {
  computeSalaryAggregateSnapshot,
  computeSalaryScoreBucketSnapshots,
  roundNullable,
  type SalaryScorePoint,
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

const BUCKET_WIDTH = 100

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
  const n = points.length
  if (n < 2) {
    return { slope: 0, intercept: n === 1 ? points[0].adjustedSalary : 0 }
  }

  let sumX = 0
  let sumY = 0
  let sumXY = 0
  let sumX2 = 0

  for (const p of points) {
    sumX += p.score
    sumY += p.adjustedSalary
    sumXY += p.score * p.adjustedSalary
    sumX2 += p.score * p.score
  }

  const denominator = n * sumX2 - sumX * sumX
  if (denominator === 0) {
    return { slope: 0, intercept: sumY / n }
  }

  const slope = (n * sumXY - sumX * sumY) / denominator
  const intercept = (sumY - slope * sumX) / n

  return {
    slope: Math.round(slope * 100) / 100,
    intercept: Math.round(intercept * 100) / 100,
  }
}

function computeScoreBuckets(points: EmployeeDataPoint[]): ScoreBucketDto[] {
  const salaryPoints: SalaryScorePoint[] = points.map((point) => ({
    score: point.score,
    gender: point.gender,
    salary: point.adjustedSalary,
  }))

  return computeSalaryScoreBucketSnapshots(salaryPoints, BUCKET_WIDTH).map(
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
