import {
  ApiArray,
  ApiBoolean,
  ApiDto,
  ApiDtoArray,
  ApiEnum,
  ApiNumber,
  ApiOptionalBoolean,
  ApiOptionalDto,
  ApiOptionalEnum,
  ApiOptionalNumber,
  ApiString,
  ApiUUId,
} from '@dmr.is/decorators'

import {
  PayStatusEnum,
  PooledReferenceModeEnum,
  WageGapBlockerEnum,
  WageGapDecompositionMethodEnum,
  WageGapDirectionEnum,
  WageGapWarningEnum,
} from '../../report/lib/wage-gap-decomposition'
import { GenderEnum } from '../../report/models/report.model'

export class SalaryAggregateMetricsDto {
  @ApiOptionalNumber({ nullable: true })
  average!: number | null

  @ApiOptionalNumber({ nullable: true })
  median!: number | null

  @ApiOptionalNumber({ nullable: true })
  minimum!: number | null

  @ApiOptionalNumber({ nullable: true })
  maximum!: number | null
}

export class SalaryDifferencesDto {
  @ApiOptionalNumber({ nullable: true })
  maleFemale!: number | null

  @ApiOptionalNumber({ nullable: true })
  maleNeutral!: number | null

  @ApiOptionalNumber({ nullable: true })
  femaleMale!: number | null

  @ApiOptionalNumber({ nullable: true })
  femaleNeutral!: number | null

  @ApiOptionalNumber({ nullable: true })
  neutralMale!: number | null

  @ApiOptionalNumber({ nullable: true })
  neutralFemale!: number | null
}

export class ReportSalaryAggregateDto {
  @ApiDto(SalaryAggregateMetricsDto)
  overall!: SalaryAggregateMetricsDto

  @ApiDto(SalaryAggregateMetricsDto)
  male!: SalaryAggregateMetricsDto

  @ApiDto(SalaryAggregateMetricsDto)
  female!: SalaryAggregateMetricsDto

  @ApiDto(SalaryAggregateMetricsDto)
  neutral!: SalaryAggregateMetricsDto

  @ApiDto(SalaryDifferencesDto)
  salaryDifferences!: SalaryDifferencesDto
}

export class SalaryCohortCountsDto {
  @ApiNumber()
  overall!: number

  @ApiNumber()
  male!: number

  @ApiNumber()
  female!: number

  @ApiNumber()
  neutral!: number
}

export class SalaryScoreBucketDto {
  @ApiNumber()
  rangeFrom!: number

  @ApiNumber()
  rangeTo!: number

  @ApiDto(ReportSalaryAggregateDto)
  totals!: ReportSalaryAggregateDto

  @ApiDto(SalaryCohortCountsDto)
  counts!: SalaryCohortCountsDto
}

export class ReportSalaryResultSnapshotDto {
  @ApiDto(ReportSalaryAggregateDto)
  totals!: ReportSalaryAggregateDto

  @ApiDtoArray(SalaryScoreBucketDto)
  scoreBuckets!: SalaryScoreBucketDto[]
}

// ─── Oaxaca-Blinder decomposition ──────────────────────────────────────────

/**
 * Per-employee attribution. Present for the audit trail — how the lágmarksmengi
 * was derived — NOT as a table for the UI to render. The UI shows the
 * lágmarksmengi above the benchmark and nothing individual below it.
 */
export class WageGapEmployeeDto {
  @ApiNumber()
  ordinal!: number

  @ApiEnum(GenderEnum)
  gender!: GenderEnum

  @ApiNumber()
  score!: number

  @ApiNumber({ description: 'Raun reglulegt tímakaup (kr./klst.).' })
  hourlyWage!: number

  @ApiNumber({
    description: 'Væntanlegt tímakaup at this score, from the pooled fit.',
  })
  expectedHourlyWage!: number

  @ApiNumber({
    description: 'frávik %: (raun − væntanlegt) / væntanlegt × 100.',
  })
  deviationPercent!: number

  @ApiNumber({ description: 'Residual in log points. Signed.' })
  residualLog!: number

  @ApiNumber({
    description:
      "This employee's contribution to óskýrt, in log points. Signed; sums exactly to oskyrtLog across all employees.",
  })
  contributionLog!: number

  @ApiOptionalNumber({
    nullable: true,
    description: 'contributionLog / oskyrtLog × 100. Null when óskýrt is 0.',
  })
  contributionShare!: number | null

  @ApiEnum(PayStatusEnum)
  payStatus!: PayStatusEnum

  @ApiBoolean({
    description: 'Underpaid AND of the disadvantaged gender — i.e. liftable.',
  })
  isCorrectable!: boolean

  @ApiBoolean({
    description:
      'Member of the lágmarksmengi: the fewest corrections that bring óskýrt under the benchmark.',
  })
  inMinimumSet!: boolean
}

export class WageGapTwofoldDto {
  @ApiOptionalNumber({
    nullable: true,
    description: 'skýrt — the part explained by starfsmatsstig, log points.',
  })
  explained!: number | null

  @ApiOptionalNumber({
    nullable: true,
    description: 'óskýrt — the residual. Identical to oskyrtLog.',
  })
  unexplained!: number | null
}

export class WageGapCountsDto {
  @ApiNumber()
  male!: number

  @ApiNumber()
  female!: number

  @ApiNumber({ description: 'Rows excluded for a non-positive hourly wage.' })
  excluded!: number
}

export class WageGapPooledFitDto {
  @ApiOptionalNumber({ nullable: true })
  slope!: number | null

  @ApiOptionalNumber({ nullable: true })
  intercept!: number | null

  @ApiNumber()
  sampleCount!: number

  @ApiOptionalNumber({ nullable: true })
  xMean!: number | null

  @ApiOptionalNumber({ nullable: true })
  yMean!: number | null

  @ApiNumber({
    description:
      'Σ(score − mean)². Zero means no slope is identifiable — test THIS, not slope !== null, because a degenerate fit returns slope 0.',
  })
  xSumSquares!: number

  @ApiOptionalNumber({ nullable: true })
  rSquared!: number | null

  @ApiOptionalNumber({ nullable: true })
  xRangeFrom!: number | null

  @ApiOptionalNumber({ nullable: true })
  xRangeTo!: number | null
}

/**
 * Kynbundinn launamunur, decomposed.
 *
 * Two figures are displayed and they are NOT interchangeable:
 *
 * - `oskyrtPercent` — **leiðréttur launamunur**, the Oaxaca unexplained term.
 *   This is the figure compared to the 3,9% benchmark.
 * - `rawGapPercent` — **óleiðréttur launamunur**, the plain difference in mean
 *   tímakaup. Informational; it has no compliance role.
 *
 * They use different averages by design (geometric vs arithmetic), so they do
 * not decompose into one another, and leiðréttur can legitimately exceed
 * óleiðréttur when the job-score mix favours the lower-paid group.
 *
 * Percentages are **magnitudes**; direction is carried separately so the
 * benchmark test is direction-agnostic. Codes only — the web maps blockers and
 * warnings to Icelandic copy.
 */
export class WageGapDecompositionDto {
  @ApiEnum(WageGapDecompositionMethodEnum)
  method!: WageGapDecompositionMethodEnum

  @ApiEnum(PooledReferenceModeEnum)
  pooledReferenceMode!: PooledReferenceModeEnum

  @ApiBoolean()
  rawGapAvailable!: boolean

  @ApiArray({
    enum: WageGapBlockerEnum,
    isArray: true,
    description:
      'Codes only — the web maps these to Icelandic copy. Empty when the raw gap is available.',
  })
  rawGapBlockers!: WageGapBlockerEnum[]

  @ApiBoolean()
  oskyrtAvailable!: boolean

  @ApiArray({
    enum: WageGapBlockerEnum,
    isArray: true,
    description:
      'Echoes the raw-tier blockers so consumers need not reason about tiers.',
  })
  oskyrtBlockers!: WageGapBlockerEnum[]

  @ApiArray({
    enum: WageGapWarningEnum,
    isArray: true,
    description: 'Soft: the figures ARE computed but must be shown caveated.',
  })
  warnings!: WageGapWarningEnum[]

  @ApiDto(WageGapCountsDto, {
    description:
      'Always real numbers, even when the figures are unavailable — this is the actionable part of the message.',
  })
  counts!: WageGapCountsDto

  @ApiOptionalDto(WageGapPooledFitDto, { nullable: true })
  pooledFit!: WageGapPooledFitDto | null

  @ApiOptionalNumber({
    nullable: true,
    description: 'Δ in log points. Signed.',
  })
  rawGapLog!: number | null

  @ApiOptionalNumber({
    nullable: true,
    description:
      'óskýrt in log points. Signed. Source of truth for the benchmark test.',
  })
  oskyrtLog!: number | null

  @ApiDto(WageGapTwofoldDto)
  twofold!: WageGapTwofoldDto

  @ApiOptionalNumber({
    nullable: true,
    description: 'Arithmetic mean, kr./klst.',
  })
  meanHourlyWageMale!: number | null

  @ApiOptionalNumber({
    nullable: true,
    description: 'Arithmetic mean, kr./klst.',
  })
  meanHourlyWageFemale!: number | null

  @ApiOptionalNumber({
    nullable: true,
    description:
      'ÓLEIÐRÉTTUR as displayed: (higher − lower) / higher on arithmetic means. Magnitude.',
  })
  rawGapPercent!: number | null

  @ApiOptionalEnum(WageGapDirectionEnum, { nullable: true })
  rawGapDirection!: WageGapDirectionEnum | null

  @ApiOptionalNumber({
    nullable: true,
    description:
      'Geometric equivalent of rawGapPercent. Stored for basis swaps.',
  })
  rawGapPercentGeometric!: number | null

  @ApiOptionalNumber({
    nullable: true,
    description:
      'LEIÐRÉTTUR launamunur: 1 − exp(−|óskýrt|). Magnitude. THE figure tested against the benchmark.',
  })
  oskyrtPercent!: number | null

  @ApiOptionalEnum(WageGapDirectionEnum, { nullable: true })
  oskyrtDirection!: WageGapDirectionEnum | null

  @ApiOptionalNumber({
    nullable: true,
    description:
      'exp(|óskýrt|) − 1 — the lower-paid-group basis. Stored, not displayed.',
  })
  oskyrtPercentLowerBase!: number | null

  @ApiOptionalEnum(WageGapDirectionEnum, { nullable: true })
  disadvantagedGender!: WageGapDirectionEnum | null

  @ApiDtoArray(WageGapEmployeeDto)
  employees!: WageGapEmployeeDto[]

  @ApiNumber({
    description: 'All underpaid employees of the disadvantaged gender.',
  })
  correctableCount!: number

  @ApiNumber({
    description:
      'Size of the lágmarksmengi — the fewest employees who must be accounted for in the úrbótaáætlun. 0 when already within the benchmark. The counterfactual correction used to pick them is a SELECTION device, not a prescribed raise.',
  })
  minimumSetSize!: number

  @ApiOptionalNumber({
    nullable: true,
    description:
      "óskýrt in log points after the set's counterfactual correction — RECOMPUTED by refitting, not |óskýrt| minus the summed contributions. Magnitude.",
  })
  oskyrtLogAfterMinimumSet!: number | null

  @ApiOptionalBoolean({
    nullable: true,
    description:
      'Whether correcting the set would bring óskýrt within the benchmark. False means the walk ran out of people to lift — the gap is carried by the advantaged group sitting above the line, so the list must NOT be presented as closing the gap. Null when no gap is computable. Read this flag; do not re-derive it by comparing oskyrtLogAfterMinimumSet to thresholdLog.',
  })
  minimumSetClosesGap!: boolean | null

  @ApiNumber({
    description: 'The benchmark in log points: −log(1 − benchmark/100).',
  })
  thresholdLog!: number

  @ApiNumber({ description: 'The configured benchmark percent (e.g. 3.9).' })
  benchmarkPercent!: number
}

export class ReportResultDto {
  @ApiUUId()
  id!: string

  @ApiUUId()
  reportId!: string

  @ApiOptionalNumber({ nullable: true })
  salaryDifferenceThresholdPercent!: number | null

  @ApiString()
  calculationVersion!: string

  @ApiDto(ReportSalaryResultSnapshotDto, {
    description:
      'Frosin samantekt á reglulegu tímakaupi við innsendingu (heildartölur + stigabil).',
  })
  salary!: ReportSalaryResultSnapshotDto

  @ApiDto(WageGapDecompositionDto)
  wageGapDecomposition!: WageGapDecompositionDto
}
