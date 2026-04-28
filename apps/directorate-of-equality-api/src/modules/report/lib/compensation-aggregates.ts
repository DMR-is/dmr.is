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

export type SalaryDeviationDirection = 'ABOVE' | 'BELOW' | 'EQUAL'

export type SalaryDeviationAssessment = {
  isDeviation: boolean
  direction: SalaryDeviationDirection | null
  differencePercent: number | null
  allowedDifferencePercent: number
  referenceSalary: number | null
}

export type CompensationAggregateResult = {
  report: {
    base: SalaryResultSnapshot
    full: SalaryResultSnapshot
  }
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

export function assessSalaryDeviationFromReference(input: {
  salary: number
  referenceSalary: number | null
  thresholdPercent: number
  useHalfThreshold?: boolean
}): SalaryDeviationAssessment {
  const allowedDifferencePercent =
    input.useHalfThreshold === false
      ? input.thresholdPercent
      : input.thresholdPercent / 2

  if (input.referenceSalary === null || input.referenceSalary === 0) {
    return {
      isDeviation: false,
      direction: null,
      differencePercent: null,
      allowedDifferencePercent,
      referenceSalary: input.referenceSalary,
    }
  }

  const differencePercent =
    ((input.salary - input.referenceSalary) / input.referenceSalary) * 100
  const absoluteDifferencePercent = Math.abs(differencePercent)

  return {
    isDeviation: absoluteDifferencePercent >= allowedDifferencePercent,
    direction: getSalaryDeviationDirection(differencePercent),
    differencePercent,
    allowedDifferencePercent,
    referenceSalary: input.referenceSalary,
  }
}

/**
 * Salary deviation/outlier rule for a score bucket:
 *
 * 1. Place the employee in a score bucket.
 * 2. Use the bucket's overall median salary as the reference salary.
 * 3. Use half of the configured salary-difference threshold by default.
 *    Example: `3.9` becomes an allowed +/- `1.95%` band around the median.
 * 4. Mark the employee as a deviation when their adjusted salary is greater
 *    than or equal to that allowed percentage above or below the bucket median.
 */
export function assessSalaryDeviationInBucket(input: {
  salary: number
  bucket: SalaryScoreBucketSnapshot
  thresholdPercent: number
  useHalfThreshold?: boolean
}): SalaryDeviationAssessment {
  return assessSalaryDeviationFromReference({
    salary: input.salary,
    referenceSalary: input.bucket.totals.overall.median,
    thresholdPercent: input.thresholdPercent,
    useHalfThreshold: input.useHalfThreshold,
  })
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

function getSalaryDeviationDirection(
  differencePercent: number,
): SalaryDeviationDirection {
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
