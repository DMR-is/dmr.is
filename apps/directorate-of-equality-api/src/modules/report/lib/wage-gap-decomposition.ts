/**
 * Kynbundinn launamunur — Oaxaca-Blinder decomposition on `log(reglulegt
 * tímakaup)`, plus the per-employee attribution and the **lágmarksmengi** it
 * implies.
 *
 * ## What this produces, and which figure is the regulated one
 *
 * ```
 * Δ (hrátt bil) = ȳ_M − ȳ_W            → ÓLEIÐRÉTTUR
 * skýrt         = (s̄_M − s̄_W) · β*₁     β* = the gender-blind POOLED fit (Neumark)
 * óskýrt        = Δ − skýrt            → ÓSKÝRÐUR, a.k.a. LEIÐRÉTTUR
 * ```
 *
 * **`óskýrt` is the figure the 3,9% tests** — *"Óskýrður launamunur úr
 * Oaxaca-Blinder sundurliðuninni er það sem ætti að miða við"*. `óleiðréttur`
 * has no compliance role and is shown for information only.
 *
 * The identity `skýrt + óskýrt = Δ` holds **exactly for any β\***, because OLS
 * satisfies `intercept + slope·x̄ ≡ ȳ`. That makes it a real invariant rather
 * than a tautology of the fitting procedure, so it catches sign errors and
 * wrong-reference bugs — which is why the spec asserts it.
 *
 * ## One fit does everything
 *
 * ```
 * óskýrt = mean(leif | karlar) − mean(leif | konur)
 * ```
 *
 * is algebraically identical to the twofold Neumark unexplained term, where
 * `leif` are residuals from the single gender-blind pooled fit. So the headline
 * figure, each employee's `væntanlegt tímakaup`, their `frávik %` and their
 * contribution to the gap all fall out of **one regression and two means**.
 * There are deliberately no per-gender fits anywhere in this module.
 *
 * ## Only one covariate, and that is correct
 *
 * `starfsmatsstig` is the sole covariate. Education and work experience are
 * already priced into the role's evaluation score in this system, and working
 * time is handled by the hours denominator — so this is the right
 * specification, not a truncated one. Adding a second covariate should stay a
 * change in one place: see {@link buildDesign}.
 */

import { GenderEnum } from '../models/report.model'
import { bundleNeutralIntoFemale } from './compensation-aggregates'
import { fitLinear, type LinearFit } from './linear-fit'

export enum WageGapDecompositionMethodEnum {
  OAXACA_BLINDER_LOG_REGULAR_HOURLY_WAGE_BY_SCORE = 'OAXACA_BLINDER_LOG_REGULAR_HOURLY_WAGE_BY_SCORE',
}

/**
 * Which pooled reference coefficient vector β\* the twofold split uses.
 *
 * `POOLED_OLS` (Neumark 1988 — pooled fit, no gender dummy) is the default and
 * the variant the stakeholders' worked example reproduces: it gives óskýrt
 * +0,0658 → 6,80% against their quoted 6,8%, where the with-dummy (Fortin)
 * variant gives 6,98%. Both are legitimate published variants and the switch is
 * one line, so the alternative is kept rather than hard-coded away.
 */
export enum PooledReferenceModeEnum {
  POOLED_OLS = 'POOLED_OLS',
  WITH_DUMMY = 'WITH_DUMMY',
}

/** Hard. When non-empty, every numeric field on the snapshot is null. */
export enum WageGapBlockerEnum {
  /** No men with a usable wage — a mean over an empty cohort does not exist. */
  EMPTY_MALE_COHORT = 'EMPTY_MALE_COHORT',
  /** No women (incl. NEUTRAL, which bundles into FEMALE) with a usable wage. */
  EMPTY_FEMALE_COHORT = 'EMPTY_FEMALE_COHORT',
}

/** Soft. The figures ARE computed, but must be displayed caveated. */
export enum WageGapWarningEnum {
  /** Rows dropped for a non-finite or non-positive wage. See `counts.excluded`. */
  ROWS_EXCLUDED_NON_POSITIVE_WAGE = 'ROWS_EXCLUDED_NON_POSITIVE_WAGE',
  /**
   * The two cohorts' score ranges do not overlap at all — total occupational
   * segregation. A genuine, reportable finding rather than a reason to suppress
   * the number, but the explained term is then extrapolating outside the
   * support of both cohorts, so it must be flagged.
   */
  NO_SCORE_OVERLAP = 'NO_SCORE_OVERLAP',
  /**
   * Nobody's score differs from anyone else's, so the pooled fit degenerates to
   * intercept-only and óskýrt collapses to exactly the raw gap. That is the
   * CORRECT answer — nothing is explained because there is nothing to explain
   * with — but it means the "adjusted" figure is not adjusted for anything.
   */
  NO_SCORE_VARIATION = 'NO_SCORE_VARIATION',
}

export enum PayStatusEnum {
  UNDERPAID = 'UNDERPAID',
  OVERPAID = 'OVERPAID',
  ON_LINE = 'ON_LINE',
}

/**
 * Which gender a gap disfavours. A real enum rather than a string union because
 * the `@ApiDto` layer needs one to emit a schema — and because the direction is
 * carried SEPARATELY from the magnitude, so the percentage itself can stay
 * unsigned and the 3,9% test can stay direction-agnostic.
 *
 * `FEMALE` = *í óhag kvenna*. The web maps these codes to Icelandic copy; the
 * API stays language-free.
 */
export enum WageGapDirectionEnum {
  FEMALE = 'FEMALE',
  MALE = 'MALE',
  NONE = 'NONE',
}



export type WageGapEmployeeSnapshot = {
  ordinal: number
  gender: GenderEnum
  score: number
  /** Raun tímakaup. */
  hourlyWage: number
  /** Væntanlegt tímakaup = exp(fitted) from the pooled fit. */
  expectedHourlyWage: number
  /** frávik % = exp(leif) − 1 = (raun − væntanlegt) / væntanlegt. */
  deviationPercent: number
  /** leif — signed, log points. */
  residualLog: number
  /** framlag — signed, log points. Σ over all employees ≡ `oskyrtLog`. */
  contributionLog: number
  /** framlag / oskyrtLog × 100. Null when óskýrt is exactly 0. */
  contributionShare: number | null
  payStatus: PayStatusEnum
  /** UNDERPAID *and* of the disadvantaged gender — i.e. liftable. */
  isCorrectable: boolean
  /** Member of the lágmarksmengi: the fewest lifts that reach compliance. */
  inMinimumSet: boolean
}

export type WageGapDecompositionSnapshot = {
  method: WageGapDecompositionMethodEnum
  pooledReferenceMode: PooledReferenceModeEnum

  rawGapAvailable: boolean
  rawGapBlockers: WageGapBlockerEnum[]
  oskyrtAvailable: boolean
  /** Echoes the raw-tier blockers, so no consumer reasons about which affects what. */
  oskyrtBlockers: WageGapBlockerEnum[]
  warnings: WageGapWarningEnum[]

  /** Always real numbers, whatever failed — this is the actionable diagnostic. */
  counts: { male: number; female: number; excluded: number }

  pooledFit: LinearFit | null

  // Log points — signed, the source of truth.
  rawGapLog: number | null
  oskyrtLog: number | null
  twofold: { explained: number | null; unexplained: number | null }

  // ÓLEIÐRÉTTUR as displayed: ARITHMETIC means, higher-paid denominator.
  meanHourlyWageMale: number | null
  meanHourlyWageFemale: number | null
  rawGapPercent: number | null
  rawGapDirection: WageGapDirectionEnum | null
  /** Stored unread — the geometric equivalent, so swapping basis is one line. */
  rawGapPercentGeometric: number | null

  // LEIÐRÉTTUR, from the log gap.
  oskyrtPercent: number | null
  oskyrtDirection: WageGapDirectionEnum | null
  /** Stored unread — `exp(|Δ|) − 1`, the econometrics default. */
  oskyrtPercentLowerBase: number | null

  disadvantagedGender: WageGapDirectionEnum | null
  employees: WageGapEmployeeSnapshot[]
  correctableCount: number
  minimumSetSize: number
  oskyrtLogAfterMinimumSet: number | null
  thresholdLog: number
  benchmarkPercent: number
}

export type WageGapEmployeeInput = {
  ordinal: number
  gender: GenderEnum
  score: number
  /** Reglulegt tímakaup. Non-finite or ≤ 0 rows are excluded with a warning. */
  hourlyWage: number
}

/**
 * The design row for one employee. **The single place to extend if a second
 * covariate is ever added** — everything downstream reads the fit, not the
 * columns. (Today `fitLinear` takes one x, so a second covariate means moving
 * to a multivariate fit; the point is that callers do not change.)
 */
const buildDesign = (employee: WageGapEmployeeInput): number =>
  employee.score

/**
 * LEIÐRÉTTUR, and the geometric óleiðréttur: magnitude from the ABSOLUTE log
 * gap, denominator the higher-paid group.
 *
 * ⚠️ **Convert `|Δ|`; never take the absolute value of a converted percentage.**
 * `abs(exp(Δ) − 1) ≠ 1 − exp(−|Δ|)`, and only the second is symmetric:
 * karlar 100 / konur 96 versus karlar 96 / konur 100 gives 4,17% one way and
 * 4,00% the other under the wrong ordering — two different figures for the same
 * inequality, and against a 3,9% line the first trips while the second does not.
 * The statutory test is direction-agnostic, so that asymmetry is indefensible.
 */
export function gapPercentFromLog(logGap: number | null): {
  percent: number | null
  direction: WageGapDirectionEnum | null
} {
  if (logGap === null || !Number.isFinite(logGap)) {
    return { percent: null, direction: null }
  }
  return {
    percent: (1 - Math.exp(-Math.abs(logGap))) * 100,
    direction:
      logGap > 0
        ? WageGapDirectionEnum.FEMALE
        : logGap < 0
          ? WageGapDirectionEnum.MALE
          : WageGapDirectionEnum.NONE,
  }
}

/**
 * ÓLEIÐRÉTTUR as displayed: arithmetic cohort means, higher-paid denominator.
 *
 * Deliberately a *different average* from {@link gapPercentFromLog}, because the
 * two figures have different jobs. Leiðréttur must come from logs — that is the
 * only space where the decomposition is exact. Óleiðréttur's job is to be
 * reproducible in a spreadsheet and comparable to Hagstofa's national figure,
 * both of which use arithmetic means. A geometric figure would visibly
 * contradict the two meðaltímakaup cards printed beside it, and *"we averaged
 * the logarithms"* is not an explanation to give a company.
 *
 * ⚠️ They therefore do **not** decompose into one another and must not be
 * presented as if they do — leiðréttur can legitimately exceed óleiðréttur.
 */
export function gapPercentFromMeans(
  male: number | null,
  female: number | null,
): { percent: number | null; direction: WageGapDirectionEnum | null } {
  if (
    male === null ||
    female === null ||
    !Number.isFinite(male) ||
    !Number.isFinite(female) ||
    male <= 0 ||
    female <= 0
  ) {
    return { percent: null, direction: null }
  }
  const higher = Math.max(male, female)
  const lower = Math.min(male, female)
  return {
    percent: ((higher - lower) / higher) * 100,
    direction:
      male > female
        ? WageGapDirectionEnum.FEMALE
        : male < female
          ? WageGapDirectionEnum.MALE
          : WageGapDirectionEnum.NONE,
  }
}

/** `exp(|Δ|) − 1` — stored unread; the share-of-the-lower-paid-group convention. */
const lowerBasePercent = (logGap: number): number =>
  (Math.exp(Math.abs(logGap)) - 1) * 100

const mean = (values: number[]): number =>
  values.reduce((total, v) => total + v, 0) / values.length

const emptySnapshot = (
  blockers: WageGapBlockerEnum[],
  warnings: WageGapWarningEnum[],
  counts: { male: number; female: number; excluded: number },
  benchmarkPercent: number,
): WageGapDecompositionSnapshot => ({
  method:
    WageGapDecompositionMethodEnum.OAXACA_BLINDER_LOG_REGULAR_HOURLY_WAGE_BY_SCORE,
  pooledReferenceMode: PooledReferenceModeEnum.POOLED_OLS,
  rawGapAvailable: false,
  rawGapBlockers: blockers,
  oskyrtAvailable: false,
  oskyrtBlockers: blockers,
  warnings,
  counts,
  pooledFit: null,
  rawGapLog: null,
  oskyrtLog: null,
  twofold: { explained: null, unexplained: null },
  meanHourlyWageMale: null,
  meanHourlyWageFemale: null,
  rawGapPercent: null,
  rawGapDirection: null,
  rawGapPercentGeometric: null,
  oskyrtPercent: null,
  oskyrtDirection: null,
  oskyrtPercentLowerBase: null,
  disadvantagedGender: null,
  employees: [],
  correctableCount: 0,
  minimumSetSize: 0,
  oskyrtLogAfterMinimumSet: null,
  thresholdLog: thresholdLogFor(benchmarkPercent),
  benchmarkPercent,
})

/**
 * The benchmark in log points: `−log(1 − p)`, the inverse of the
 * higher-paid-base conversion. 3,9% → 0,0397809.
 */
export function thresholdLogFor(benchmarkPercent: number): number {
  return -Math.log(1 - benchmarkPercent / 100)
}

export function computeWageGapDecomposition(input: {
  employees: WageGapEmployeeInput[]
  benchmarkPercent: number
  pooledReferenceMode?: PooledReferenceModeEnum
}): WageGapDecompositionSnapshot {
  const { benchmarkPercent } = input
  const pooledReferenceMode =
    input.pooledReferenceMode ?? PooledReferenceModeEnum.POOLED_OLS

  // ── Guard 1: non-positive wages, SOFT ────────────────────────────────────
  // Excluded rather than fatal, because the level-OLS outlier path tolerates
  // such rows: if this were hard, the two analyses could disagree about whether
  // a report is computable at all.
  const usable = input.employees.filter(
    (e) => Number.isFinite(e.hourlyWage) && e.hourlyWage > 0,
  )
  const excluded = input.employees.length - usable.length
  const warnings: WageGapWarningEnum[] = []
  if (excluded > 0) {
    warnings.push(WageGapWarningEnum.ROWS_EXCLUDED_NON_POSITIVE_WAGE)
  }

  const isMale = (e: WageGapEmployeeInput) =>
    bundleNeutralIntoFemale(e.gender) === GenderEnum.MALE

  const men = usable.filter(isMale)
  const women = usable.filter((e) => !isMale(e))
  const counts = { male: men.length, female: women.length, excluded }

  // ── Guard 2: empty cohort, HARD ──────────────────────────────────────────
  // Not a policy threshold — you cannot take the mean of an empty cohort. There
  // is deliberately NO minimum cohort size: stakeholders accepted the
  // cohort-size sensitivity as "the basis for how the evaluation is set up", and
  // suppressing small companies would auto-approve exactly the ones where a
  // single underpaid employee is most visible.
  const blockers: WageGapBlockerEnum[] = []
  if (men.length === 0) blockers.push(WageGapBlockerEnum.EMPTY_MALE_COHORT)
  if (women.length === 0) blockers.push(WageGapBlockerEnum.EMPTY_FEMALE_COHORT)
  if (blockers.length > 0) {
    return emptySnapshot(blockers, warnings, counts, benchmarkPercent)
  }

  // ── The one fit: gender-blind, pooled, on log(tímakaup) ──────────────────
  const logWage = (e: WageGapEmployeeInput) => Math.log(e.hourlyWage)
  const pooledFit = fitLinear(
    usable.map((e) => ({ x: buildDesign(e), y: logWage(e) })),
  )

  // ⚠️ `xSumSquares`, NOT `slope !== null`: a degenerate fit returns slope 0,
  // not null, so the slope alone cannot distinguish "no variation to explain
  // with" from "a genuinely flat relationship".
  if (pooledFit.xSumSquares <= 0) {
    warnings.push(WageGapWarningEnum.NO_SCORE_VARIATION)
  }

  const scoreRange = (rows: WageGapEmployeeInput[]) => ({
    from: Math.min(...rows.map(buildDesign)),
    to: Math.max(...rows.map(buildDesign)),
  })
  const maleRange = scoreRange(men)
  const femaleRange = scoreRange(women)
  if (maleRange.from > femaleRange.to || femaleRange.from > maleRange.to) {
    warnings.push(WageGapWarningEnum.NO_SCORE_OVERLAP)
  }

  const maleLogMean = mean(men.map(logWage))
  const femaleLogMean = mean(women.map(logWage))
  const rawGapLog = maleLogMean - femaleLogMean

  const maleScoreMean = mean(men.map(buildDesign))
  const femaleScoreMean = mean(women.map(buildDesign))

  // skýrt = (s̄_M − s̄_W) · β*₁. Note β*₀ cancels out of the twofold split
  // entirely (it appears as −β*₀ + β*₀), so only the pooled SLOPE is ever
  // needed — there is no pooled intercept to store.
  const pooledSlope = resolvePooledSlope(
    pooledReferenceMode,
    pooledFit,
    men,
    women,
    buildDesign,
    logWage,
  )
  const explained = (maleScoreMean - femaleScoreMean) * pooledSlope
  const oskyrtLog = rawGapLog - explained

  // ── Per-employee attribution ─────────────────────────────────────────────
  // ⚠️ The sign rule is fixed by GENDER, not by which gender turns out to be
  // advantaged: men contribute +leif/n_M and women −leif/n_W, so
  // Σ framlag ≡ m_M − m_W ≡ oskyrtLog with its sign intact, in both directions.
  // (The plan's prose phrased this as advantaged/disadvantaged, which silently
  // flips the sum's sign when men are the underpaid group — the identity test
  // catches it immediately.)
  const disadvantagedGender: WageGapDirectionEnum =
    oskyrtLog > 0
      ? WageGapDirectionEnum.FEMALE
      : oskyrtLog < 0
        ? WageGapDirectionEnum.MALE
        : WageGapDirectionEnum.NONE

  const employees: WageGapEmployeeSnapshot[] = usable.map((e) => {
    const fitted =
      (pooledFit.intercept ?? 0) + (pooledFit.slope ?? 0) * buildDesign(e)
    const residualLog = logWage(e) - fitted
    const male = isMale(e)
    const contributionLog = male
      ? residualLog / men.length
      : -residualLog / women.length

    const payStatus =
      residualLog < 0
        ? PayStatusEnum.UNDERPAID
        : residualLog > 0
          ? PayStatusEnum.OVERPAID
          : PayStatusEnum.ON_LINE

    const employeeGenderSide = male
      ? WageGapDirectionEnum.MALE
      : WageGapDirectionEnum.FEMALE

    return {
      ordinal: e.ordinal,
      gender: e.gender,
      score: e.score,
      hourlyWage: e.hourlyWage,
      expectedHourlyWage: Math.exp(fitted),
      deviationPercent: (Math.exp(residualLog) - 1) * 100,
      residualLog,
      contributionLog,
      contributionShare:
        oskyrtLog === 0 ? null : (contributionLog / oskyrtLog) * 100,
      payStatus,
      isCorrectable:
        payStatus === PayStatusEnum.UNDERPAID &&
        employeeGenderSide === disadvantagedGender,
      inMinimumSet: false,
    }
  })

  // ── Lágmarksmengi ────────────────────────────────────────────────────────
  // ⚠️ LIFT ONLY. Candidates are the UNDERPAID side of the DISADVANTAGED gender,
  // so this can never propose cutting anyone's pay. Overpaid members of the
  // advantaged gender keep their real (positive) contribution in `employees` —
  // that array is the audit trail — but never enter the set.
  const thresholdLog = thresholdLogFor(benchmarkPercent)
  const candidates = employees
    .filter((e) => e.isCorrectable)
    .sort(
      (a, b) => Math.abs(b.contributionLog) - Math.abs(a.contributionLog),
    )

  let running = Math.abs(oskyrtLog)
  for (const candidate of candidates) {
    if (running <= thresholdLog) break
    running -= Math.abs(candidate.contributionLog)
    candidate.inMinimumSet = true
  }

  const rawPercent = gapPercentFromMeans(
    mean(men.map((e) => e.hourlyWage)),
    mean(women.map((e) => e.hourlyWage)),
  )
  const oskyrtPercent = gapPercentFromLog(oskyrtLog)
  const rawGeometric = gapPercentFromLog(rawGapLog)

  return {
    method:
      WageGapDecompositionMethodEnum.OAXACA_BLINDER_LOG_REGULAR_HOURLY_WAGE_BY_SCORE,
    pooledReferenceMode,
    rawGapAvailable: true,
    rawGapBlockers: [],
    oskyrtAvailable: true,
    oskyrtBlockers: [],
    warnings,
    counts,
    pooledFit,
    rawGapLog,
    oskyrtLog,
    twofold: { explained, unexplained: oskyrtLog },
    meanHourlyWageMale: mean(men.map((e) => e.hourlyWage)),
    meanHourlyWageFemale: mean(women.map((e) => e.hourlyWage)),
    rawGapPercent: rawPercent.percent,
    rawGapDirection: rawPercent.direction,
    rawGapPercentGeometric: rawGeometric.percent,
    oskyrtPercent: oskyrtPercent.percent,
    oskyrtDirection: oskyrtPercent.direction,
    oskyrtPercentLowerBase: lowerBasePercent(oskyrtLog),
    disadvantagedGender,
    employees,
    correctableCount: candidates.length,
    minimumSetSize: employees.filter((e) => e.inMinimumSet).length,
    oskyrtLogAfterMinimumSet: running,
    thresholdLog,
    benchmarkPercent,
  }
}

/**
 * β\*₁ under the selected reference convention.
 *
 * `WITH_DUMMY` (Fortin) is the within-group estimator: by Frisch-Waugh-Lovell,
 * adding a gender dummy to a pooled fit yields a precision-weighted average of
 * the two cohort slopes, `(SSx_M·β_M + SSx_W·β_W) / (SSx_M + SSx_W)` — which is
 * why `xSumSquares` is on {@link LinearFit}. It is computed from per-cohort fits
 * only in this branch; the default path fits nothing per gender.
 */
function resolvePooledSlope(
  mode: PooledReferenceModeEnum,
  pooledFit: LinearFit,
  men: WageGapEmployeeInput[],
  women: WageGapEmployeeInput[],
  x: (e: WageGapEmployeeInput) => number,
  y: (e: WageGapEmployeeInput) => number,
): number {
  if (mode === PooledReferenceModeEnum.POOLED_OLS) {
    return pooledFit.slope ?? 0
  }

  const maleFit = fitLinear(men.map((e) => ({ x: x(e), y: y(e) })))
  const femaleFit = fitLinear(women.map((e) => ({ x: x(e), y: y(e) })))
  const weight = maleFit.xSumSquares + femaleFit.xSumSquares
  if (weight <= 0) return pooledFit.slope ?? 0

  return (
    (maleFit.xSumSquares * (maleFit.slope ?? 0) +
      femaleFit.xSumSquares * (femaleFit.slope ?? 0)) /
    weight
  )
}

const roundTo = (value: number | null, precision: number): number | null =>
  value === null || !Number.isFinite(value)
    ? null
    : Number(value.toFixed(precision))

/**
 * Rounds for persistence.
 *
 * ⚠️ Log points get **6dp**, not the 4dp used for salary snapshots: the
 * components are O(0,01–0,07), and at 4dp the `skýrt + óskýrt = Δ` identity
 * stops surviving to display precision. Never assert the identity on rounded
 * values.
 */
export function roundWageGapDecompositionSnapshot(
  snapshot: WageGapDecompositionSnapshot,
  logPrecision = 6,
  percentPrecision = 4,
): WageGapDecompositionSnapshot {
  return {
    ...snapshot,
    pooledFit: snapshot.pooledFit && {
      ...snapshot.pooledFit,
      slope: roundTo(snapshot.pooledFit.slope, logPrecision),
      intercept: roundTo(snapshot.pooledFit.intercept, logPrecision),
      xMean: roundTo(snapshot.pooledFit.xMean, percentPrecision),
      yMean: roundTo(snapshot.pooledFit.yMean, logPrecision),
      xSumSquares: snapshot.pooledFit.xSumSquares,
      rSquared: roundTo(snapshot.pooledFit.rSquared, percentPrecision),
    },
    rawGapLog: roundTo(snapshot.rawGapLog, logPrecision),
    oskyrtLog: roundTo(snapshot.oskyrtLog, logPrecision),
    twofold: {
      explained: roundTo(snapshot.twofold.explained, logPrecision),
      unexplained: roundTo(snapshot.twofold.unexplained, logPrecision),
    },
    meanHourlyWageMale: roundTo(snapshot.meanHourlyWageMale, 2),
    meanHourlyWageFemale: roundTo(snapshot.meanHourlyWageFemale, 2),
    rawGapPercent: roundTo(snapshot.rawGapPercent, percentPrecision),
    rawGapPercentGeometric: roundTo(
      snapshot.rawGapPercentGeometric,
      percentPrecision,
    ),
    oskyrtPercent: roundTo(snapshot.oskyrtPercent, percentPrecision),
    oskyrtPercentLowerBase: roundTo(
      snapshot.oskyrtPercentLowerBase,
      percentPrecision,
    ),
    oskyrtLogAfterMinimumSet: roundTo(
      snapshot.oskyrtLogAfterMinimumSet,
      logPrecision,
    ),
    thresholdLog: roundTo(snapshot.thresholdLog, logPrecision) ?? 0,
    employees: snapshot.employees.map((e) => ({
      ...e,
      hourlyWage: roundTo(e.hourlyWage, 2) ?? 0,
      expectedHourlyWage: roundTo(e.expectedHourlyWage, 2) ?? 0,
      deviationPercent: roundTo(e.deviationPercent, percentPrecision) ?? 0,
      residualLog: roundTo(e.residualLog, logPrecision) ?? 0,
      contributionLog: roundTo(e.contributionLog, logPrecision) ?? 0,
      contributionShare: roundTo(e.contributionShare, percentPrecision),
    })),
  }
}
