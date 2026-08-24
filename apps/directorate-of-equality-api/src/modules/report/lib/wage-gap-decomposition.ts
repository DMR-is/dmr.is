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
 * **Neumark (1988) — a pooled fit with no gender dummy.** It reproduces the
 * stakeholders' worked example (óskýrt +0,0658 → 6,80% against their quoted
 * 6,8%) and the Directorate's own R reference names it as the convention it
 * publishes: `group.weight = -1 -> sameiginlegt líkan (Neumark); oftast birt`.
 *
 * Recorded on every snapshot rather than merely implied, because the figure is
 * regulatory: which reference produced it is part of what the number means.
 *
 * ⚠️ **A `WITH_DUMMY` (Fortin) variant used to sit beside it and was removed.**
 * It existed only because the plan could not tell from the methodology PDF which
 * convention was intended, so it implemented both and left a test to decide.
 * The R reference settled that, at which point the alternative was dead code —
 * and worse than dead: it was reached by no caller, it broke the
 * `Σ framlag ≡ óskýrt` identity (contributions are attributed from the pooled
 * fit's residuals, which a within-group slope no longer matches), and it forced
 * a slow fallback path into {@link makeIncrementalGap}.
 *
 * Should it ever be wanted, the estimator is one expression, not a rediscovery:
 * by Frisch-Waugh-Lovell, adding a gender dummy to a pooled fit yields the
 * precision-weighted average of the two cohort slopes,
 * `(SSx_M·β_M + SSx_W·β_W) / (SSx_M + SSx_W)` — which is what `xSumSquares` on
 * {@link LinearFit} is for. Re-adding it also means re-deriving the per-employee
 * attribution so the identity survives.
 */
export enum PooledReferenceModeEnum {
  POOLED_OLS = 'POOLED_OLS',
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
  /**
   * This employee's framlag shares the sign of `oskyrtLog` — they carry part of
   * the gap rather than offsetting it, and are therefore eligible for the
   * lágmarksmengi walk. Which SIDE of the line they sit on is `payStatus`.
   *
   * Two quadrants qualify: UNDERPAID on the disadvantaged side, and OVERPAID on
   * the advantaged side. The other two offset the gap and are never candidates.
   */
  widensGap: boolean
  /** Member of the lágmarksmengi: the fewest corrections that reach compliance. */
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
  /**
   * How many employees carry the gap (`widensGap`). A POPULATION, not a
   * compliance signal — it is the pool the walk selects from, and a compliant
   * company can still have a large one. For compliance read
   * `oskyrtWithinBenchmark`.
   */
  gapCarrierCount: number
  minimumSetSize: number
  /**
   * **The** compliance boolean: `|oskyrtLog| <= thresholdLog`, evaluated on the
   * unrounded log gap. Null when there is no computable gap.
   *
   * ⚠️ Read this rather than re-deriving compliance from `minimumSetSize > 0`
   * or by comparing a rounded percentage to the benchmark. Those two used to
   * agree with it and no longer always do: the walk can decline to commit a
   * candidate that would push the gap further out, so an empty set is reachable
   * on a company that is over the benchmark.
   */
  oskyrtWithinBenchmark: boolean | null
  /**
   * óskýrt after the set's counterfactual correction, RECOMPUTED — a refitted
   * figure, not `|óskýrt| − Σ|framlag|`. Magnitude.
   */
  oskyrtLogAfterMinimumSet: number | null
  /**
   * Which gender óskýrt disfavours AFTER the set's correction. Needed because
   * `oskyrtLogAfterMinimumSet` is a magnitude, and a two-sided correction can
   * overshoot: the residual gap may now run the other way. `NONE` when it lands
   * exactly on zero, null when there is no computable gap.
   */
  oskyrtDirectionAfterMinimumSet: WageGapDirectionEnum | null
  /**
   * Whether correcting the set would actually bring óskýrt within the benchmark.
   *
   * `false` means the walk ran out of people to lift: the gap is carried by the
   * advantaged group sitting above the line, and no set of raises on the
   * disadvantaged side reaches the benchmark. The list is still the right list
   * to account for — it just must not be presented as closing the gap. Null when
   * there is no computable gap at all.
   *
   * ⚠️ Do NOT re-derive this by comparing `oskyrtLogAfterMinimumSet` to
   * `thresholdLog` and expecting agreement at the boundary; read this flag.
   */
  minimumSetClosesGap: boolean | null
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
const buildDesign = (employee: WageGapEmployeeInput): number => employee.score

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
  gapCarrierCount: 0,
  minimumSetSize: 0,
  oskyrtWithinBenchmark: null,
  oskyrtLogAfterMinimumSet: null,
  oskyrtDirectionAfterMinimumSet: null,
  minimumSetClosesGap: null,
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

/**
 * Which gender a signed log gap disfavours. Positive means men earn more, so
 * the gap is í óhag kvenna. Exactly zero is `NONE` rather than a coin flip.
 */
function directionOfLogGap(signedLogGap: number): WageGapDirectionEnum {
  return signedLogGap > 0
    ? WageGapDirectionEnum.FEMALE
    : signedLogGap < 0
      ? WageGapDirectionEnum.MALE
      : WageGapDirectionEnum.NONE
}

/** One fit's worth of output: the gap, its split, and each employee's part. */
type GapAttribution = {
  pooledFit: LinearFit
  rawGapLog: number
  explained: number
  oskyrtLog: number
  disadvantagedGender: WageGapDirectionEnum
  employees: WageGapEmployeeSnapshot[]
}

/**
 * One pooled fit over the wages handed in, plus every employee's contribution.
 *
 * Extracted from {@link computeWageGapDecomposition} for one reason: the
 * lágmarksmengi walk has to ask "what would óskýrt be if this person were paid
 * differently", and the only honest way to answer is to fit again. Everything
 * here is a pure function of `usable`, so calling it with one wage changed gives
 * the genuinely refitted answer.
 */
function attributeGap(
  usable: WageGapEmployeeInput[],
  isMale: (employee: WageGapEmployeeInput) => boolean,
): GapAttribution {
  const logWage = (employee: WageGapEmployeeInput) =>
    Math.log(employee.hourlyWage)
  const men = usable.filter(isMale)
  const women = usable.filter((employee) => !isMale(employee))

  const pooledFit = fitLinear(
    usable.map((employee) => ({
      x: buildDesign(employee),
      y: logWage(employee),
    })),
  )

  const rawGapLog = mean(men.map(logWage)) - mean(women.map(logWage))

  // skýrt = (s̄_M − s̄_W) · β*₁. β*₀ cancels out of the twofold split entirely
  // (it appears as −β*₀ + β*₀), so only the pooled SLOPE is ever needed — and
  // under the Neumark reference that is simply the pooled fit's own slope.
  const pooledSlope = pooledFit.slope ?? 0
  const explained =
    (mean(men.map(buildDesign)) - mean(women.map(buildDesign))) * pooledSlope
  const oskyrtLog = rawGapLog - explained

  // ⚠️ The sign rule is fixed by GENDER, not by which gender turns out to be
  // advantaged: men contribute +leif/n_M and women −leif/n_W, so
  // Σ framlag ≡ m_M − m_W ≡ oskyrtLog with its sign intact, in both directions.
  const disadvantagedGender: WageGapDirectionEnum =
    oskyrtLog > 0
      ? WageGapDirectionEnum.FEMALE
      : oskyrtLog < 0
        ? WageGapDirectionEnum.MALE
        : WageGapDirectionEnum.NONE

  /**
   * The other side. `NONE` stays `NONE` so neither quadrant matches and no
   * employee is a carrier — correct when there is no gap to carry.
   */
  const advantagedGender: WageGapDirectionEnum =
    disadvantagedGender === WageGapDirectionEnum.FEMALE
      ? WageGapDirectionEnum.MALE
      : disadvantagedGender === WageGapDirectionEnum.MALE
        ? WageGapDirectionEnum.FEMALE
        : WageGapDirectionEnum.NONE

  const employees: WageGapEmployeeSnapshot[] = usable.map((employee) => {
    const fitted =
      (pooledFit.intercept ?? 0) +
      (pooledFit.slope ?? 0) * buildDesign(employee)
    const residualLog = logWage(employee) - fitted
    const male = isMale(employee)
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
      ordinal: employee.ordinal,
      gender: employee.gender,
      score: employee.score,
      hourlyWage: employee.hourlyWage,
      expectedHourlyWage: Math.exp(fitted),
      deviationPercent: (Math.exp(residualLog) - 1) * 100,
      residualLog,
      contributionLog,
      contributionShare:
        oskyrtLog === 0 ? null : (contributionLog / oskyrtLog) * 100,
      payStatus,
      // ⚠️ Written from the enums, NOT as `Math.sign(contributionLog) ===
      // Math.sign(oskyrtLog)`. `Math.sign(0) === 0`, so the arithmetic form
      // flags every ON_LINE employee as a carrier when óskýrt is exactly zero —
      // a state this function reaches, because it computes the flag before the
      // walk's early return. Checked against the sign test in all four
      // quadrants: they agree everywhere the sign test is meaningful.
      widensGap:
        payStatus === PayStatusEnum.UNDERPAID
          ? employeeGenderSide === disadvantagedGender
          : payStatus === PayStatusEnum.OVERPAID
            ? employeeGenderSide === advantagedGender
            : false,
      inMinimumSet: false,
    }
  })

  return {
    pooledFit,
    rawGapLog,
    explained,
    oskyrtLog,
    disadvantagedGender,
    employees,
  }
}

type MinimumSetWalk = {
  chosen: Set<number>
  oskyrtLogAfter: number
  /** Signed, so the caller can report which way any residual gap runs. */
  oskyrtLogAfterSigned: number
  closesGap: boolean
}

/**
 * One greedy pass down an ordered pool.
 *
 * `guarded` turns on probe-before-commit, which is what makes a two-directional
 * pool safe. A one-directional walk can only ever move óskýrt toward zero, so
 * every step is an improvement by construction. A two-directional walk can move
 * it THROUGH zero: a candidate carrying more than twice the remaining gap
 * overshoots, and every later pick then makes things worse. Measured over
 * synthetic cohorts, an unguarded two-sided walk closed the gap LESS often than
 * lift-only for small, high-dispersion companies — and sometimes named more
 * people while doing it.
 *
 * The guard needs no new constant or tolerance. A candidate is committed only if
 * the refitted gap lands inside the benchmark, or is strictly closer to zero
 * than before. Anything else would widen the gap, and a member that widens the
 * gap cannot belong to a minimal set that closes it.
 */
function walkPool(
  usable: WageGapEmployeeInput[],
  isMale: (employee: WageGapEmployeeInput) => boolean,
  thresholdLog: number,
  initial: GapAttribution,
  targetFor: (ordinal: number) => number,
  pool: WageGapEmployeeSnapshot[],
  guarded: boolean,
): MinimumSetWalk {
  const running = makeIncrementalGap(usable, isMale, initial)

  const chosen = new Set<number>()
  let signed = initial.oskyrtLog
  let gap = Math.abs(signed)

  for (const candidate of pool) {
    const target = targetFor(candidate.ordinal)

    if (guarded) {
      const probed = Math.abs(running.probe(candidate.ordinal, target))
      if (probed > thresholdLog && probed >= gap) continue
    }

    chosen.add(candidate.ordinal)
    signed = running.commit(candidate.ordinal, target)
    gap = Math.abs(signed)

    if (gap <= thresholdLog) {
      return {
        chosen,
        oskyrtLogAfter: gap,
        oskyrtLogAfterSigned: signed,
        closesGap: true,
      }
    }
  }

  return {
    chosen,
    oskyrtLogAfter: gap,
    oskyrtLogAfterSigned: signed,
    closesGap: false,
  }
}

/**
 * Picks between two candidate walks, on one objective in three tiers:
 *
 * 1. Landing inside the benchmark beats not landing inside it.
 * 2. Among walks that land, name fewer people. Being named carries an
 *    obligation, so two more than necessary is a real unfairness.
 * 3. Among walks that do not, get closer — more of the gap accounted for.
 *
 * Ties go to `preferred`, the two-directional result: equal burden, and the
 * question asked of someone paid above their starfsmatsstig is usually the more
 * productive one (the likeliest honest answer is that the job evaluation is
 * wrong, which costs nobody their pay).
 */
function betterWalk(
  preferred: MinimumSetWalk,
  fallback: MinimumSetWalk,
): MinimumSetWalk {
  if (preferred.closesGap !== fallback.closesGap) {
    return preferred.closesGap ? preferred : fallback
  }
  if (preferred.closesGap) {
    return preferred.chosen.size <= fallback.chosen.size ? preferred : fallback
  }
  return preferred.oskyrtLogAfter <= fallback.oskyrtLogAfter
    ? preferred
    : fallback
}

/**
 * The lágmarksmengi: the fewest employees who have to be accounted for.
 *
 * ⚠️ **A SELECTION device, not a prescription.** The counterfactual correction
 * below is how the list is chosen; it is not a raise — or a cut — anyone is
 * being told to make. The úrbótaáætlun asks the company for a reason and an
 * action per listed employee, and improvement is demonstrated at company level
 * at the next report, so the only thing that matters here is that the list be
 * minimal and defensible. Naming a person carries a burden, and naming two more
 * than necessary is a real unfairness even though no money is prescribed.
 *
 * ⚠️ **Two-directional.** Candidates are everyone whose framlag shares the sign
 * of óskýrt: the underpaid on the disadvantaged side AND the overpaid on the
 * advantaged side. There is no separate rule for the second group — the pool
 * simply widens to everyone pulling the gap open, and the existing
 * biggest-carrier-first ordering picks whoever carries most. In an imbalanced
 * workforce that is usually the well-paid few, which is why the list gets
 * SHORTER rather than longer.
 *
 * Being listed as paid ABOVE your starfsmatsstig asks a different question from
 * being listed as paid below them, and the likeliest honest answer is that the
 * job evaluation is wrong — the correction then goes to the evaluation and
 * nobody's pay moves at all. `payStatus` carries the direction per row so the
 * two can be prompted differently.
 *
 * ⚠️ **Refits after every pick, and that is the whole point.** This used to be
 * `running -= |contributionLog|` over a candidate list sorted once — arithmetic
 * on a fit that was never recomputed. But óskýrt is
 * `rawGapLog − (s̄_M − s̄_W)·β*₁`, and β*₁ is fitted to the very wages being
 * changed: moving one person moves the line and every other residual with it.
 * The omitted term is `−(s̄_M − s̄_W)·(xᵢ − x̄)·Δy / SSx`, zero only when the two
 * genders happen to share a mean score. Measured over synthetic cohorts, the
 * old estimate put the set at 16 where a refit needs 14, and elsewhere claimed
 * compliance at cohorts that were still over the benchmark after correction —
 * wrong in both directions, so not even conservative.
 *
 * There is no new constant and no tolerance anywhere in here. The walk stops
 * when the RECOMPUTED gap is within the same statutory `thresholdLog`, or when
 * the pool runs out — see {@link walkPool} for why a two-directional pool needs
 * a probe before each commit, and {@link betterWalk} for why the narrower
 * one-directional pool is walked as well.
 *
 * ⚠️ Identity is by `ordinal`, which `assertParsedPayloadIntegrity` guarantees
 * unique upstream. Duplicated ordinals would move more than one row per pick.
 */
function selectMinimumSet(
  usable: WageGapEmployeeInput[],
  isMale: (employee: WageGapEmployeeInput) => boolean,
  thresholdLog: number,
  initial: GapAttribution,
): MinimumSetWalk {
  const initialGap = Math.abs(initial.oskyrtLog)
  if (initialGap <= thresholdLog) {
    return {
      chosen: new Set(),
      oskyrtLogAfter: initialGap,
      oskyrtLogAfterSigned: initial.oskyrtLog,
      closesGap: true,
    }
  }

  // ⚠️ Correction targets come from the ORIGINAL fit — the very
  // `expectedHourlyWage` the snapshot publishes for each employee and the
  // úrbótaáætlun table prints as `Væntanlegt tímakaup`. That is deliberate and
  // it is the reason this is not a step-by-step refit of the correction
  // AMOUNTS: a reviewer must be able to take the published set, move each
  // member to the published figure, re-run the engine and land on exactly
  // `oskyrtLogAfterMinimumSet`. Re-deriving targets from intermediate fits gave
  // a marginally different number that appeared nowhere in the snapshot and so
  // could not be audited or reproduced.
  const targets = new Map(
    initial.employees.map((employee) => [
      employee.ordinal,
      employee.expectedHourlyWage,
    ]),
  )

  /** Throws on a miss rather than passing 0 into the refit. See `stepOf`. */
  const targetFor = (ordinal: number): number => {
    const target = targets.get(ordinal)
    if (target === undefined) {
      throw new Error(
        `selectMinimumSet: no published target for ordinal ${ordinal}`,
      )
    }
    return target
  }

  // Ordered once, biggest carrier of óskýrt first. Greedy, so "fewest" is an
  // approximation rather than a proven optimum, but the STOPPING TEST is a real
  // refit rather than a running subtraction.
  //
  // ⚠️ The ordinal tie-break is load-bearing, not cosmetic. Two employees on
  // an identical rate at an identical score — an ordinary pay grade — have
  // bit-identical |contributionLog|. Array#sort is stable, so without this
  // the winner is decided by INPUT order, and the two queries feeding this
  // (report-result.service and report-draft-analysis.service) return
  // whatever order Postgres hands back. If only one of the pair fits inside
  // the set, the preview and the submit can disagree about who is in it and
  // the submit guard rejects with "Detected outlier(s) missing from the
  // outlier groups". Both halves are fixed: this comparator, and an explicit
  // `order` on both queries.
  const carriers = initial.employees
    .filter((employee) => employee.widensGap)
    .sort(
      (a, b) =>
        Math.abs(b.contributionLog) - Math.abs(a.contributionLog) ||
        a.ordinal - b.ordinal,
    )

  // ⚠️ Both walks are run, and the better result wins. Two-directional is a
  // large improvement on average and a REGRESSION on a small tail — there are
  // cohort shapes where lift-only closes the gap and two-sided, guard and all,
  // does not. Running the narrower pool as well costs one extra O(n) pass and
  // guarantees no company gets a worse answer than the one-directional rule
  // would have given it. That guarantee is worth more than the pass costs.
  const twoDirectional = walkPool(
    usable,
    isMale,
    thresholdLog,
    initial,
    targetFor,
    carriers,
    true,
  )
  const liftOnly = walkPool(
    usable,
    isMale,
    thresholdLog,
    initial,
    targetFor,
    carriers.filter(
      (employee) => employee.payStatus === PayStatusEnum.UNDERPAID,
    ),
    false,
  )

  return betterWalk(twoDirectional, liftOnly)
}

/**
 * Returns a pair of operations over a running fit: `probe` reports the óskýrt
 * that a counterfactual correction WOULD produce, and `commit` applies it and
 * reports the same figure — each **exactly** what a full refit would produce,
 * in O(1) per call instead of O(n).
 *
 * `probe` exists so a caller can reject a candidate before it is applied
 * without having to commit-and-restore. Restoring is not bit-exact — floating
 * addition is not associative, so `x + d - d !== x` in general — and this
 * figure is published as `oskyrtLogAfterMinimumSet`, which a reviewer is
 * invited to reproduce. A separate read-only computation avoids putting drift
 * of that kind into a regulatory number.
 *
 * ⚠️ **Both directions are supported.** Every operation below is linear in
 * `Δ` — no absolute values, no branch on its sign — so moving an OVERPAID
 * employee DOWN onto the line is the same arithmetic as lifting an UNDERPAID
 * one up, with `Δ < 0`.
 *
 * ⚠️ **This is a performance fix for a real problem, not a micro-optimisation.**
 * Calling {@link attributeGap} once per candidate is O(n) per step over up to
 * `n/2` steps, i.e. quadratic. Measured on synthetic cohorts: 338 ms at n=1 000,
 * 8,0 s at n=5 000 and **32 s at n=10 000** — and `MAX_EMPLOYEES` is 10 000,
 * with this running inside the submit transaction.
 *
 * The algebra that makes it exact: **scores never change**, only wages. So for a
 * single-covariate OLS with an intercept, writing `Sxy = Σ(xᵢ − x̄)·yᵢ` (valid
 * because `Σ(xᵢ − x̄) = 0`), raising one employee's `y` by `Δ` gives
 *
 *   Sxy' = Sxy + (xᵢ − x̄)·Δ          slope' = Sxy' / Sxx
 *   ȳ_side' = ȳ_side + Δ / n_side     rawGap' = ȳ_M' − ȳ_W'
 *   óskýrt' = rawGap' − (x̄_M − x̄_W)·slope'
 *
 * while `x̄`, `Sxx`, `x̄_M`, `x̄_W`, `n_M` and `n_W` are all untouched. Every
 * quantity is carried forward, nothing is re-summed.
 *
 * The equality with a full refit is not taken on trust — a spec lifts the
 * published set, re-runs the whole engine and asserts agreement to 9 decimal
 * places.
 *
 * ⚠️ Relies on the pooled slope being the pooled fit's own slope, which is what
 * the Neumark reference means. A within-group reference derives β\* from two
 * per-gender fits, which no single running sum tracks — that variant was removed
 * (see {@link PooledReferenceModeEnum}), and re-adding it would need a fallback
 * to full recomputation here.
 */
type IncrementalGap = {
  /** óskýrt if this correction were applied. Does not mutate. */
  probe: (ordinal: number, correctedWage: number) => number
  /** Applies the correction and returns the resulting óskýrt. */
  commit: (ordinal: number, correctedWage: number) => number
}

function makeIncrementalGap(
  usable: WageGapEmployeeInput[],
  isMale: (employee: WageGapEmployeeInput) => boolean,
  initial: GapAttribution,
): IncrementalGap {
  const logWage = (employee: WageGapEmployeeInput) =>
    Math.log(employee.hourlyWage)

  const men = usable.filter(isMale)
  const women = usable.filter((employee) => !isMale(employee))
  const nMale = men.length
  const nFemale = women.length

  const xMean = initial.pooledFit.xMean ?? 0
  const xSumSquares = initial.pooledFit.xSumSquares
  const maleScoreMean = mean(men.map(buildDesign))
  const femaleScoreMean = mean(women.map(buildDesign))
  const scoreMeanDiff = maleScoreMean - femaleScoreMean

  // Sxy recovered from the fit rather than re-summed: slope = Sxy / Sxx.
  // A degenerate fit (Sxx = 0) keeps slope 0 throughout, so óskýrt then tracks
  // the raw gap alone — which is what `NO_SCORE_VARIATION` already means.
  let sumXy = (initial.pooledFit.slope ?? 0) * xSumSquares
  let maleLogMean = mean(men.map(logWage))
  let femaleLogMean = mean(women.map(logWage))

  const byOrdinal = new Map(
    usable.map((employee) => [employee.ordinal, employee]),
  )
  const currentLog = new Map(
    usable.map((employee) => [employee.ordinal, logWage(employee)]),
  )

  /** óskýrt implied by a candidate Sxy and pair of side means. Pure. */
  const gapFrom = (sxy: number, male: number, female: number): number =>
    male - female - scoreMeanDiff * (xSumSquares > 0 ? sxy / xSumSquares : 0)

  /**
   * Resolves one step. Throws rather than returning the unchanged gap: the
   * previous version silently reported "no movement" for an unknown ordinal or
   * a non-positive target, which read to the caller as a candidate that failed
   * to help — indistinguishable from a genuine one, and it had already been
   * added to the set by then.
   */
  const stepOf = (ordinal: number, correctedWage: number) => {
    const employee = byOrdinal.get(ordinal)
    if (!employee) {
      throw new Error(
        `makeIncrementalGap: ordinal ${ordinal} is not in the analysed cohort`,
      )
    }
    if (!Number.isFinite(correctedWage) || correctedWage <= 0) {
      throw new Error(
        `makeIncrementalGap: ordinal ${ordinal} has a non-positive correction target (${correctedWage})`,
      )
    }
    const next = Math.log(correctedWage)
    const delta = next - (currentLog.get(ordinal) ?? logWage(employee))
    return { employee, next, delta }
  }

  return {
    probe(ordinal, correctedWage) {
      const { employee, delta } = stepOf(ordinal, correctedWage)
      const male = isMale(employee)
      return gapFrom(
        sumXy + (buildDesign(employee) - xMean) * delta,
        male ? maleLogMean + delta / nMale : maleLogMean,
        male ? femaleLogMean : femaleLogMean + delta / nFemale,
      )
    },

    commit(ordinal, correctedWage) {
      const { employee, next, delta } = stepOf(ordinal, correctedWage)
      currentLog.set(ordinal, next)
      sumXy += (buildDesign(employee) - xMean) * delta
      if (isMale(employee)) {
        maleLogMean += delta / nMale
      } else {
        femaleLogMean += delta / nFemale
      }
      return gapFrom(sumXy, maleLogMean, femaleLogMean)
    },
  }
}

export function computeWageGapDecomposition(input: {
  employees: WageGapEmployeeInput[]
  benchmarkPercent: number
}): WageGapDecompositionSnapshot {
  const { benchmarkPercent } = input

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

  // ── The fit, the attribution, and the warnings that depend on them ───────
  // `attributeGap` is a pure function of the rows handed to it, which is what
  // lets the lágmarksmengi walk below call it again on modified wages.
  const core = attributeGap(usable, isMale)
  const { pooledFit, rawGapLog, explained, oskyrtLog, disadvantagedGender } =
    core
  const employees = core.employees

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

  // ── Lágmarksmengi ────────────────────────────────────────────────────────
  const thresholdLog = thresholdLogFor(benchmarkPercent)
  const selection = selectMinimumSet(usable, isMale, thresholdLog, core)
  for (const employee of employees) {
    employee.inMinimumSet = selection.chosen.has(employee.ordinal)
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
    pooledReferenceMode: PooledReferenceModeEnum.POOLED_OLS,
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
    gapCarrierCount: employees.filter((e) => e.widensGap).length,
    minimumSetSize: employees.filter((e) => e.inMinimumSet).length,
    oskyrtWithinBenchmark: Math.abs(oskyrtLog) <= thresholdLog,
    oskyrtLogAfterMinimumSet: selection.oskyrtLogAfter,
    oskyrtDirectionAfterMinimumSet: directionOfLogGap(
      selection.oskyrtLogAfterSigned,
    ),
    minimumSetClosesGap: selection.closesGap,
    thresholdLog,
    benchmarkPercent,
  }
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
