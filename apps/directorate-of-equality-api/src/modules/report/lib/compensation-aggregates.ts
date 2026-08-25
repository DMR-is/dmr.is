import { GenderEnum } from '../models/report.enums'
import { fitLinear } from './linear-fit'

export type CompensationEmployeeInput = {
  reportEmployeeRoleId: string
  score: number
  gender: GenderEnum
  paidHours: number
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

export type CompensationAggregateResult = {
  report: {
    snapshot: SalaryResultSnapshot
  }
}

/**
 * Width of the score buckets the aggregate snapshot groups by. Survives the
 * retirement of the ±band because it is a *reporting* grouping — it never had
 * any part in deciding who was flagged.
 */
export const SCORE_BUCKET_WIDTH = 100

/**
 * A fitted level-space line. **No longer persisted** — it went into
 * `report_result.outlier_analysis_snapshot`, which retired with the band. It is
 * now computed live for the chart only, so this shape is free to change.
 */
export type SalaryRegressionSnapshot = {
  slope: number | null
  intercept: number | null
  sampleCount: number
  scoreMean: number | null
  hourlyWageMean: number | null
  rSquared: number | null
  scoreRangeFrom: number | null
  scoreRangeTo: number | null
}

type AggregateGroup = {
  overall: number[]
  male: number[]
  female: number[]
  neutral: number[]
}

/**
 * The pay fields {@link getRegularHourlyWage} reads — deliberately
 * score-independent so it accepts a `report_employee` row whose `score` may be
 * NULL (a draft) as well as a fully-formed `CompensationEmployeeInput`.
 */
export type RegularHourlyWageInput = {
  paidHours: number
  baseSalary: number
  additionalSalary: number
  bonusSalary: number | null
}

/**
 * Reglulegt tímakaup — the single pay quantity every salary statistic is
 * evaluated on, per the regulation's *"reglulegum launum, reiknuðum niður á
 * tímakaup"*.
 *
 * Replaces the previous pair of adjusted-salary helpers. There is no
 * base-pay-only counterpart **by construction**, not merely because nothing
 * needed one: `baseSalary / paidHours` would divide a base-pay-only numerator
 * by a denominator that includes the overtime hours which generated the
 * additional and bonus pay. Under the old FTE divisor both variants were
 * coherent; under an hours divisor only the total-pay numerator is.
 */
export function getRegularHourlyWage(employee: RegularHourlyWageInput): number {
  return (
    (employee.baseSalary +
      employee.additionalSalary +
      (employee.bonusSalary ?? 0)) /
    employee.paidHours
  )
}

/**
 * Current product rule: the gender salary gap is measured as MALE vs
 * FEMALE+NEUTRAL, so NEUTRAL is bundled into the FEMALE group for every
 * grouping, count and gender-split regression. Raw NEUTRAL data is preserved
 * untouched in `report_employee` — this only reclassifies at computation time.
 * Centralised here so the rule is reversible when NEUTRAL gets its own
 * category later.
 */
export function bundleNeutralIntoFemale(gender: GenderEnum): GenderEnum {
  return gender === GenderEnum.NEUTRAL ? GenderEnum.FEMALE : gender
}

export function computeCompensationAggregates(input: {
  employees: CompensationEmployeeInput[]
  bucketWidth?: number
}): CompensationAggregateResult {
  const samples: SalaryScorePoint[] = input.employees.map((employee) => ({
    gender: employee.gender,
    score: employee.score,
    salary: getRegularHourlyWage(employee),
  }))

  return {
    report: {
      snapshot: computeSalaryResultSnapshot(samples, input.bucketWidth),
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
 * Least-squares regression in **level space** (kr./klst. vs stig), for the
 * gender-vs-score chart.
 *
 * ⚠️ This is NOT the fit the analysis rests on. The kynbundinn launamunur — and
 * with it every compliance decision — comes from the pooled fit on
 * `log(tímakaup)` in `wage-gap-decomposition.ts`. This line exists because a
 * chart with krónur on the y-axis wants a krónur-per-stig slope; it is
 * descriptive, and nothing reads it to decide anything.
 *
 * A naming adapter over {@link fitLinear} — the arithmetic lives there so the
 * same routine can fit log wages without reporting an `hourlyWageMean` of
 * `-8.34`. Callers needing the identifiability test (see {@link fitLinear})
 * should use `fitLinear` directly.
 */
export function computeSalaryRegression(
  samples: Array<{ score: number; regularHourlyWage: number }>,
): SalaryRegressionSnapshot {
  const fit = fitLinear(
    samples.map((sample) => ({ x: sample.score, y: sample.regularHourlyWage })),
  )

  return {
    slope: fit.slope,
    intercept: fit.intercept,
    sampleCount: fit.sampleCount,
    scoreMean: fit.xMean,
    hourlyWageMean: fit.yMean,
    rSquared: fit.rSquared,
    scoreRangeFrom: fit.xRangeFrom,
    scoreRangeTo: fit.xRangeTo,
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

    // NEUTRAL is bundled into the FEMALE group (see bundleNeutralIntoFemale);
    // the standalone `neutral` group is therefore always empty here.
    if (bundleNeutralIntoFemale(sample.gender) === GenderEnum.MALE) {
      grouped.male.push(sample.salary)
    } else {
      grouped.female.push(sample.salary)
    }
  }

  return grouped
}

function countSamplesByCohort(
  samples: GenderSalarySample[],
): SalaryCohortCounts {
  return {
    overall: samples.length,
    male: samples.filter(
      (sample) => bundleNeutralIntoFemale(sample.gender) === GenderEnum.MALE,
    ).length,
    // FEMALE count includes NEUTRAL; the standalone neutral count is therefore
    // 0 (raw neutral data remains in report_employee).
    female: samples.filter(
      (sample) => bundleNeutralIntoFemale(sample.gender) === GenderEnum.FEMALE,
    ).length,
    neutral: 0,
  }
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
