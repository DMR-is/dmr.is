import { GenderEnum } from '../models/report.model'

export type CompensationEmployeeInput = {
  reportEmployeeRoleId: string
  score: number
  gender: GenderEnum
  workRatio: number
  baseSalary: number
  additionalSalary: number
  bonusSalary: number | null
}

export type GenderSalarySample = {
  gender: GenderEnum
  salary: number
}

export type SalaryScorePoint = GenderSalarySample & {
  score: number
}

export type SalaryAggregateMetrics = {
  average: number | null
  median: number | null
  minimum: number | null
  maximum: number | null
}

export type SalaryDifferences = {
  maleFemale: number | null
  maleNeutral: number | null
  femaleMale: number | null
  femaleNeutral: number | null
  neutralMale: number | null
  neutralFemale: number | null
}

export type SalaryAggregateSnapshot = {
  overall: SalaryAggregateMetrics
  male: SalaryAggregateMetrics
  female: SalaryAggregateMetrics
  neutral: SalaryAggregateMetrics
  salaryDifferences: SalaryDifferences
}

export type SalaryCohortCounts = {
  overall: number
  male: number
  female: number
  neutral: number
}

export type SalaryScoreBucketSnapshot = {
  rangeFrom: number
  rangeTo: number
  totals: SalaryAggregateSnapshot
  counts: SalaryCohortCounts
}

export type SalaryResultSnapshot = {
  totals: SalaryAggregateSnapshot
  scoreBuckets: SalaryScoreBucketSnapshot[]
}

export type SalaryOutlierDirection = 'ABOVE' | 'BELOW' | 'EQUAL'

export type SalaryOutlierAssessment = {
  isOutlier: boolean
  direction: SalaryOutlierDirection | null
  differencePercent: number | null
  allowedDifferencePercent: number
  predictedSalary: number | null
}

export type CompensationAggregateResult = {
  report: {
    base: SalaryResultSnapshot
    full: SalaryResultSnapshot
  }
}

export enum SalaryOutlierAnalysisMethodEnum {
  BASE_SALARY_LINEAR_REGRESSION_BY_SCORE = 'BASE_SALARY_LINEAR_REGRESSION_BY_SCORE',
}

export const SCORE_BUCKET_WIDTH = 100

export type SalaryRegressionSnapshot = {
  slope: number | null
  intercept: number | null
  sampleCount: number
  scoreMean: number | null
  adjustedBaseSalaryMean: number | null
  rSquared: number | null
  scoreRangeFrom: number | null
  scoreRangeTo: number | null
}

/**
 * Regressions fitted on adjusted base salary vs score.
 *
 * `overall` is gender-blind and is the line that drives the outlier flag.
 * `male` / `female` / `neutral` are fitted on each cohort separately and are
 * carried for visualisation/analytics only — the outlier rule does not use
 * them.
 */
export type SalaryRegressionsByGenderSnapshot = {
  overall: SalaryRegressionSnapshot
  male: SalaryRegressionSnapshot
  female: SalaryRegressionSnapshot
  neutral: SalaryRegressionSnapshot
}

export type SalaryOutlierAnalysisEmployeeSnapshot = {
  ordinal: number
  score: number
  gender: GenderEnum
  adjustedBaseSalary: number
  predictedBaseSalary: number | null
  scoreBucketRangeFrom: number | null
  scoreBucketRangeTo: number | null
  direction: SalaryOutlierDirection | null
  differencePercent: number | null
  allowedDifferencePercent: number
  isOutlier: boolean
}

export type SalaryOutlierAnalysisSnapshot = {
  method: SalaryOutlierAnalysisMethodEnum
  thresholdPercent: number
  allowedDifferencePercent: number
  regressions: SalaryRegressionsByGenderSnapshot
  employees: SalaryOutlierAnalysisEmployeeSnapshot[]
}

type AggregateGroup = {
  overall: number[]
  male: number[]
  female: number[]
  neutral: number[]
}

export function getAdjustedBaseSalary(
  employee: CompensationEmployeeInput,
): number {
  return employee.baseSalary / employee.workRatio
}

export function getAdjustedFullSalary(
  employee: CompensationEmployeeInput,
): number {
  return (
    (employee.baseSalary +
      employee.additionalSalary +
      (employee.bonusSalary ?? 0)) /
    employee.workRatio
  )
}

export function computeCompensationAggregates(input: {
  employees: CompensationEmployeeInput[]
  bucketWidth?: number
}): CompensationAggregateResult {
  const baseSamples: SalaryScorePoint[] = input.employees.map((employee) => ({
    gender: employee.gender,
    score: employee.score,
    salary: getAdjustedBaseSalary(employee),
  }))
  const fullSamples: SalaryScorePoint[] = input.employees.map((employee) => ({
    gender: employee.gender,
    score: employee.score,
    salary: getAdjustedFullSalary(employee),
  }))

  return {
    report: {
      base: computeSalaryResultSnapshot(baseSamples, input.bucketWidth),
      full: computeSalaryResultSnapshot(fullSamples, input.bucketWidth),
    },
  }
}

export function computeSalaryResultSnapshot(
  samples: SalaryScorePoint[],
  bucketWidth = 100,
): SalaryResultSnapshot {
  return {
    totals: computeSalaryAggregateSnapshot(samples),
    scoreBuckets: computeSalaryScoreBucketSnapshots(samples, bucketWidth),
  }
}

export function computeSalaryAggregateSnapshot(
  samples: GenderSalarySample[],
): SalaryAggregateSnapshot {
  const grouped = groupSalaries(samples)

  return {
    overall: computeMetrics(grouped.overall),
    male: computeMetrics(grouped.male),
    female: computeMetrics(grouped.female),
    neutral: computeMetrics(grouped.neutral),
    salaryDifferences: {
      maleFemale: computeWageGapPercent(
        average(grouped.male),
        average(grouped.female),
      ),
      maleNeutral: computeWageGapPercent(
        average(grouped.male),
        average(grouped.neutral),
      ),
      femaleMale: computeWageGapPercent(
        average(grouped.female),
        average(grouped.male),
      ),
      femaleNeutral: computeWageGapPercent(
        average(grouped.female),
        average(grouped.neutral),
      ),
      neutralMale: computeWageGapPercent(
        average(grouped.neutral),
        average(grouped.male),
      ),
      neutralFemale: computeWageGapPercent(
        average(grouped.neutral),
        average(grouped.female),
      ),
    },
  }
}

export function computeSalaryScoreBucketSnapshots(
  samples: SalaryScorePoint[],
  bucketWidth = 100,
): SalaryScoreBucketSnapshot[] {
  if (samples.length === 0) {
    return []
  }

  const minScore = Math.min(...samples.map((sample) => sample.score))
  const maxScore = Math.max(...samples.map((sample) => sample.score))
  const bucketStart = Math.floor(minScore / bucketWidth) * bucketWidth
  const bucketEnd =
    Math.floor(maxScore / bucketWidth) * bucketWidth + bucketWidth
  const buckets: SalaryScoreBucketSnapshot[] = []

  for (
    let rangeFrom = bucketStart;
    rangeFrom < bucketEnd;
    rangeFrom += bucketWidth
  ) {
    const rangeTo = rangeFrom + bucketWidth
    const inBucket = samples.filter(
      (sample) => sample.score >= rangeFrom && sample.score < rangeTo,
    )

    if (inBucket.length === 0) {
      continue
    }

    buckets.push({
      rangeFrom,
      rangeTo,
      totals: computeSalaryAggregateSnapshot(inBucket),
      counts: countSamplesByCohort(inBucket),
    })
  }

  return buckets
}

export function roundSalaryAggregateSnapshot(
  snapshot: SalaryAggregateSnapshot,
  precision = 2,
): SalaryAggregateSnapshot {
  return {
    overall: roundMetrics(snapshot.overall, precision),
    male: roundMetrics(snapshot.male, precision),
    female: roundMetrics(snapshot.female, precision),
    neutral: roundMetrics(snapshot.neutral, precision),
    salaryDifferences: {
      maleFemale: roundNullable(
        snapshot.salaryDifferences.maleFemale,
        precision,
      ),
      maleNeutral: roundNullable(
        snapshot.salaryDifferences.maleNeutral,
        precision,
      ),
      femaleMale: roundNullable(
        snapshot.salaryDifferences.femaleMale,
        precision,
      ),
      femaleNeutral: roundNullable(
        snapshot.salaryDifferences.femaleNeutral,
        precision,
      ),
      neutralMale: roundNullable(
        snapshot.salaryDifferences.neutralMale,
        precision,
      ),
      neutralFemale: roundNullable(
        snapshot.salaryDifferences.neutralFemale,
        precision,
      ),
    },
  }
}

export function roundSalaryResultSnapshot(
  snapshot: SalaryResultSnapshot,
  precision = 2,
): SalaryResultSnapshot {
  return {
    totals: roundSalaryAggregateSnapshot(snapshot.totals, precision),
    scoreBuckets: snapshot.scoreBuckets.map((bucket) => ({
      ...bucket,
      totals: roundSalaryAggregateSnapshot(bucket.totals, precision),
    })),
  }
}

/**
 * Compares an employee's salary to a predicted salary at their exact score
 * and flags them as an outlier when the absolute difference is at or above
 * the supplied band. Caller is responsible for deriving
 * `allowedDifferencePercent` from the configured threshold (typically half
 * of `salary_difference_threshold_percent`).
 */
export function assessSalaryOutlierFromPrediction(input: {
  salary: number
  predictedSalary: number | null
  allowedDifferencePercent: number
}): SalaryOutlierAssessment {
  if (input.predictedSalary === null || input.predictedSalary <= 0) {
    return {
      isOutlier: false,
      direction: null,
      differencePercent: null,
      allowedDifferencePercent: input.allowedDifferencePercent,
      predictedSalary: input.predictedSalary,
    }
  }

  const differencePercent =
    ((input.salary - input.predictedSalary) / input.predictedSalary) * 100
  const absoluteDifferencePercent = Math.abs(differencePercent)

  return {
    isOutlier: absoluteDifferencePercent >= input.allowedDifferencePercent,
    direction: getSalaryOutlierDirection(differencePercent),
    differencePercent,
    allowedDifferencePercent: input.allowedDifferencePercent,
    predictedSalary: input.predictedSalary,
  }
}

export function resolveAllowedDifferencePercent(
  thresholdPercent: number,
  useHalfThreshold = true,
): number {
  return useHalfThreshold ? thresholdPercent / 2 : thresholdPercent
}

export type OutlierDetectionEmployee = {
  ordinal: number
  score: number
  gender: GenderEnum
  workRatio: number
  baseSalary: number
}

export type DetectedOutlier = {
  ordinal: number
  score: number
  adjustedBaseSalary: number
  predictedBaseSalary: number
  scoreBucketRangeFrom: number
  scoreBucketRangeTo: number
  assessment: SalaryOutlierAssessment
}

/**
 * Canonical outlier detection. Single source of truth for the
 * application-side preview endpoint and the submit-side guard:
 *
 * - Adjusts each employee's base salary (`baseSalary / workRatio`).
 * - Fits one regression line from score -> adjusted base salary.
 * - Assesses each employee against the predicted salary at their exact score.
 * - Returns only the rows where the assessment is an outlier.
 */
export function detectOutliers(input: {
  employees: OutlierDetectionEmployee[]
  thresholdPercent: number
  useHalfThreshold?: boolean
}): DetectedOutlier[] {
  const analysis = computeSalaryOutlierAnalysis(input)
  const outliers: DetectedOutlier[] = []

  for (const employee of analysis.employees) {
    if (
      employee.isOutlier &&
      employee.predictedBaseSalary !== null &&
      employee.scoreBucketRangeFrom !== null &&
      employee.scoreBucketRangeTo !== null
    ) {
      outliers.push({
        ordinal: employee.ordinal,
        score: employee.score,
        adjustedBaseSalary: employee.adjustedBaseSalary,
        predictedBaseSalary: employee.predictedBaseSalary,
        scoreBucketRangeFrom: employee.scoreBucketRangeFrom,
        scoreBucketRangeTo: employee.scoreBucketRangeTo,
        assessment: {
          isOutlier: employee.isOutlier,
          direction: employee.direction,
          differencePercent: employee.differencePercent,
          allowedDifferencePercent: employee.allowedDifferencePercent,
          predictedSalary: employee.predictedBaseSalary,
        },
      })
    }
  }

  return outliers
}

/**
 * Salary outlier analysis rule:
 *
 * 1. Adjust each employee's base salary to a full-time equivalent.
 * 2. Fit a gender-blind least-squares regression line from
 *    score -> adjusted base salary (`regressions.overall`).
 * 3. Predict the employee's salary at their exact score using that line.
 * 4. Use half of the configured salary-difference threshold by default.
 *    Example: `3.9` becomes an allowed +/- `1.95%` band around the line.
 * 5. Mark the employee as an outlier when their adjusted base salary is
 *    greater than or equal to that allowed percentage above or below the
 *    predicted salary.
 *
 * Per-cohort regressions (`regressions.male/female/neutral`) are also fitted
 * and snapshotted for visualisation/analytics. They do not influence the
 * outlier flag.
 *
 * Score-bucket placement (`scoreBucketRangeFrom/To`) is preserved per
 * employee so reviewers can still cross-reference the bucket-level
 * aggregates carried in `report_result.base_snapshot.scoreBuckets`. It does
 * not influence the outlier flag either.
 */
export function computeSalaryOutlierAnalysis(input: {
  employees: OutlierDetectionEmployee[]
  thresholdPercent: number
  useHalfThreshold?: boolean
}): SalaryOutlierAnalysisSnapshot {
  const adjustedEmployees = input.employees.map((employee) => ({
    ordinal: employee.ordinal,
    score: employee.score,
    gender: employee.gender,
    adjustedBaseSalary: employee.baseSalary / employee.workRatio,
  }))
  const regressions = computeRegressionsByGender(adjustedEmployees)
  const overallRegression = regressions.overall
  const allowedDifferencePercent = resolveAllowedDifferencePercent(
    input.thresholdPercent,
    input.useHalfThreshold,
  )

  return {
    method: SalaryOutlierAnalysisMethodEnum.BASE_SALARY_LINEAR_REGRESSION_BY_SCORE,
    thresholdPercent: input.thresholdPercent,
    allowedDifferencePercent,
    regressions,
    employees: adjustedEmployees.map((employee) => {
      const predictedBaseSalary = predictFromRegression(
        overallRegression,
        employee.score,
      )
      const bucketRangeFrom = bucketRangeFromScore(employee.score)
      const assessment = assessSalaryOutlierFromPrediction({
        salary: employee.adjustedBaseSalary,
        predictedSalary: predictedBaseSalary,
        allowedDifferencePercent,
      })

      return {
        ordinal: employee.ordinal,
        score: employee.score,
        gender: employee.gender,
        adjustedBaseSalary: employee.adjustedBaseSalary,
        predictedBaseSalary,
        scoreBucketRangeFrom: bucketRangeFrom,
        scoreBucketRangeTo: bucketRangeFrom + SCORE_BUCKET_WIDTH,
        direction: assessment.direction,
        differencePercent: assessment.differencePercent,
        allowedDifferencePercent: assessment.allowedDifferencePercent,
        isOutlier: assessment.isOutlier,
      }
    }),
  }
}

function bucketRangeFromScore(score: number): number {
  return Math.floor(score / SCORE_BUCKET_WIDTH) * SCORE_BUCKET_WIDTH
}

function predictFromRegression(
  regression: SalaryRegressionSnapshot,
  score: number,
): number | null {
  if (regression.slope === null || regression.intercept === null) {
    return null
  }
  return regression.slope * score + regression.intercept
}

function computeRegressionsByGender(
  samples: Array<{
    score: number
    gender: GenderEnum
    adjustedBaseSalary: number
  }>,
): SalaryRegressionsByGenderSnapshot {
  return {
    overall: computeSalaryRegression(samples),
    male: computeSalaryRegression(
      samples.filter((sample) => sample.gender === GenderEnum.MALE),
    ),
    female: computeSalaryRegression(
      samples.filter((sample) => sample.gender === GenderEnum.FEMALE),
    ),
    neutral: computeSalaryRegression(
      samples.filter((sample) => sample.gender === GenderEnum.NEUTRAL),
    ),
  }
}

/**
 * Canonical least-squares regression used everywhere in the app:
 * outlier detection, the gender-vs-score chart, and any future analytics
 * that needs to fit a salary-vs-score line. Returns the line plus enough
 * descriptive stats (means, ranges, r²) to render or interpret it.
 */
export function computeSalaryRegression(
  samples: Array<{ score: number; adjustedBaseSalary: number }>,
): SalaryRegressionSnapshot {
  if (samples.length === 0) {
    return {
      slope: null,
      intercept: null,
      sampleCount: 0,
      scoreMean: null,
      adjustedBaseSalaryMean: null,
      rSquared: null,
      scoreRangeFrom: null,
      scoreRangeTo: null,
    }
  }

  let sumScore = 0
  let sumSalary = 0
  let scoreMin = samples[0].score
  let scoreMax = samples[0].score
  for (const sample of samples) {
    sumScore += sample.score
    sumSalary += sample.adjustedBaseSalary
    if (sample.score < scoreMin) scoreMin = sample.score
    if (sample.score > scoreMax) scoreMax = sample.score
  }

  const scoreMean = sumScore / samples.length
  const adjustedBaseSalaryMean = sumSalary / samples.length

  let denominator = 0
  let numerator = 0
  let totalSquares = 0
  for (const sample of samples) {
    const dx = sample.score - scoreMean
    const dy = sample.adjustedBaseSalary - adjustedBaseSalaryMean
    denominator += dx * dx
    numerator += dx * dy
    totalSquares += dy * dy
  }

  if (denominator === 0) {
    return {
      slope: 0,
      intercept: adjustedBaseSalaryMean,
      sampleCount: samples.length,
      scoreMean,
      adjustedBaseSalaryMean,
      rSquared: null,
      scoreRangeFrom: scoreMin,
      scoreRangeTo: scoreMax,
    }
  }

  const slope = numerator / denominator
  const intercept = adjustedBaseSalaryMean - slope * scoreMean

  let residualSquares = 0
  for (const sample of samples) {
    const predicted = slope * sample.score + intercept
    const residual = sample.adjustedBaseSalary - predicted
    residualSquares += residual * residual
  }

  return {
    slope,
    intercept,
    sampleCount: samples.length,
    scoreMean,
    adjustedBaseSalaryMean,
    rSquared: totalSquares === 0 ? null : 1 - residualSquares / totalSquares,
    scoreRangeFrom: scoreMin,
    scoreRangeTo: scoreMax,
  }
}

export function roundSalaryOutlierAnalysisSnapshot(
  snapshot: SalaryOutlierAnalysisSnapshot,
  salaryPrecision = 2,
  percentPrecision = 4,
): SalaryOutlierAnalysisSnapshot {
  const roundRegression = (
    regression: SalaryRegressionSnapshot,
  ): SalaryRegressionSnapshot => ({
    slope: roundNullable(regression.slope, salaryPrecision),
    intercept: roundNullable(regression.intercept, salaryPrecision),
    sampleCount: regression.sampleCount,
    scoreMean: roundNullable(regression.scoreMean, salaryPrecision),
    adjustedBaseSalaryMean: roundNullable(
      regression.adjustedBaseSalaryMean,
      salaryPrecision,
    ),
    rSquared: roundNullable(regression.rSquared, percentPrecision),
    scoreRangeFrom: roundNullable(regression.scoreRangeFrom, salaryPrecision),
    scoreRangeTo: roundNullable(regression.scoreRangeTo, salaryPrecision),
  })

  return {
    ...snapshot,
    thresholdPercent: roundNullable(
      snapshot.thresholdPercent,
      percentPrecision,
    ) as number,
    allowedDifferencePercent: roundNullable(
      snapshot.allowedDifferencePercent,
      percentPrecision,
    ) as number,
    regressions: {
      overall: roundRegression(snapshot.regressions.overall),
      male: roundRegression(snapshot.regressions.male),
      female: roundRegression(snapshot.regressions.female),
      neutral: roundRegression(snapshot.regressions.neutral),
    },
    employees: snapshot.employees.map((employee) => ({
      ...employee,
      score: roundNullable(employee.score, salaryPrecision) as number,
      adjustedBaseSalary: roundNullable(
        employee.adjustedBaseSalary,
        salaryPrecision,
      ) as number,
      predictedBaseSalary: roundNullable(
        employee.predictedBaseSalary,
        salaryPrecision,
      ),
      differencePercent: roundNullable(
        employee.differencePercent,
        percentPrecision,
      ),
      allowedDifferencePercent: roundNullable(
        employee.allowedDifferencePercent,
        percentPrecision,
      ) as number,
    })),
  }
}

export function roundNullable(
  value: number | null,
  precision = 2,
): number | null {
  if (value === null) {
    return null
  }

  const factor = 10 ** precision
  return Math.round(value * factor) / factor
}

export function computeWageGapPercent(
  leftAverage: number | null,
  rightAverage: number | null,
): number | null {
  if (leftAverage === null || rightAverage === null || leftAverage === 0) {
    return null
  }

  return ((leftAverage - rightAverage) / leftAverage) * 100
}

function groupSalaries(samples: GenderSalarySample[]): AggregateGroup {
  const grouped: AggregateGroup = {
    overall: [],
    male: [],
    female: [],
    neutral: [],
  }

  for (const sample of samples) {
    grouped.overall.push(sample.salary)

    if (sample.gender === GenderEnum.MALE) {
      grouped.male.push(sample.salary)
      continue
    }

    if (sample.gender === GenderEnum.FEMALE) {
      grouped.female.push(sample.salary)
      continue
    }

    if (sample.gender === GenderEnum.NEUTRAL) {
      grouped.neutral.push(sample.salary)
    }
  }

  return grouped
}

function countSamplesByCohort(
  samples: GenderSalarySample[],
): SalaryCohortCounts {
  return {
    overall: samples.length,
    male: samples.filter((sample) => sample.gender === GenderEnum.MALE).length,
    female: samples.filter((sample) => sample.gender === GenderEnum.FEMALE)
      .length,
    neutral: samples.filter((sample) => sample.gender === GenderEnum.NEUTRAL)
      .length,
  }
}

function getSalaryOutlierDirection(
  differencePercent: number,
): SalaryOutlierDirection {
  if (differencePercent > 0) {
    return 'ABOVE'
  }

  if (differencePercent < 0) {
    return 'BELOW'
  }

  return 'EQUAL'
}

function computeMetrics(values: number[]): SalaryAggregateMetrics {
  return {
    average: averageMetric(),
    median: medianMetric(),
    minimum: minimumMetric(),
    maximum: maximumMetric(),
  }

  function averageMetric() {
    return values.length > 0 ? sum(values) / values.length : null
  }

  function medianMetric() {
    if (values.length === 0) {
      return null
    }

    const sorted = [...values].sort((left, right) => left - right)
    const middleIndex = Math.floor(sorted.length / 2)

    return sorted.length % 2 === 0
      ? (sorted[middleIndex - 1] + sorted[middleIndex]) / 2
      : sorted[middleIndex]
  }

  function minimumMetric() {
    return values.length > 0 ? Math.min(...values) : null
  }

  function maximumMetric() {
    return values.length > 0 ? Math.max(...values) : null
  }
}

function average(values: number[]): number | null {
  return values.length > 0 ? sum(values) / values.length : null
}

function roundMetrics(
  metrics: SalaryAggregateMetrics,
  precision: number,
): SalaryAggregateMetrics {
  return {
    average: roundNullable(metrics.average, precision),
    median: roundNullable(metrics.median, precision),
    minimum: roundNullable(metrics.minimum, precision),
    maximum: roundNullable(metrics.maximum, precision),
  }
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0)
}
