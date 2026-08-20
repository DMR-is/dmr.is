import { GenderEnum } from '../models/report.model'
import {
  computeWageGapDecomposition,
  gapPercentFromLog,
  gapPercentFromMeans,
  PayStatusEnum,
  PooledReferenceModeEnum,
  roundWageGapDecompositionSnapshot,
  thresholdLogFor,
  WageGapBlockerEnum,
  type WageGapEmployeeInput,
  WageGapWarningEnum,
} from './wage-gap-decomposition'

/** Narrows a nullable snapshot field, failing the test rather than asserting `!`. */
function assertNumber(value: number | null): asserts value is number {
  if (value === null) {
    throw new Error('expected a computed number, got null')
  }
}

const BENCHMARK = 3.9

const employee = (
  ordinal: number,
  gender: GenderEnum,
  score: number,
  hourlyWage: number,
): WageGapEmployeeInput => ({ ordinal, gender, score, hourlyWage })

/** Deterministic mixed company: both genders across a range of scores. */
const mixedCompany = (): WageGapEmployeeInput[] => [
  employee(1, GenderEnum.MALE, 200, 3100),
  employee(2, GenderEnum.MALE, 300, 3800),
  employee(3, GenderEnum.MALE, 400, 4300),
  employee(4, GenderEnum.MALE, 500, 5200),
  employee(5, GenderEnum.MALE, 600, 6100),
  employee(6, GenderEnum.FEMALE, 200, 2900),
  employee(7, GenderEnum.FEMALE, 300, 3500),
  employee(8, GenderEnum.FEMALE, 400, 4150),
  employee(9, GenderEnum.FEMALE, 500, 4800),
  employee(10, GenderEnum.FEMALE, 600, 5600),
]

/**
 * Cohorts with genuinely different score composition — men concentrated in
 * higher-scoring roles. Needed wherever `explained` must be non-zero: with
 * identical score distributions the term is `(s̄_M − s̄_W)·β* = 0` for ANY β*,
 * so the reference-convention choice cannot show up at all.
 */
const segregatedCompany = (): WageGapEmployeeInput[] => [
  employee(1, GenderEnum.MALE, 500, 5200),
  employee(2, GenderEnum.MALE, 600, 6100),
  employee(3, GenderEnum.MALE, 700, 6600),
  employee(4, GenderEnum.MALE, 400, 4300),
  employee(5, GenderEnum.FEMALE, 200, 2900),
  employee(6, GenderEnum.FEMALE, 300, 3500),
  employee(7, GenderEnum.FEMALE, 400, 4150),
  employee(8, GenderEnum.FEMALE, 500, 4700),
]

const run = (
  employees: WageGapEmployeeInput[],
  pooledReferenceMode?: PooledReferenceModeEnum,
) =>
  computeWageGapDecomposition({
    employees,
    benchmarkPercent: BENCHMARK,
    pooledReferenceMode,
  })

describe('wage-gap-decomposition', () => {
  describe('the identities — the primary correctness gate', () => {
    // Holds for ANY β*, which is what makes it a real invariant rather than a
    // restatement of the fitting procedure. Catches sign errors and
    // wrong-reference-group bugs.
    it.each([
      PooledReferenceModeEnum.POOLED_OLS,
      PooledReferenceModeEnum.WITH_DUMMY,
    ])('skýrt + óskýrt = Δ under %s', (mode) => {
      const s = run(mixedCompany(), mode)

      expect(
        Math.abs(
          (s.twofold.explained ?? 0) +
            (s.twofold.unexplained ?? 0) -
            (s.rawGapLog ?? 0),
        ),
      ).toBeLessThan(1e-9)
    })

    it('Δ equals the difference in mean log wage between the cohorts', () => {
      const rows = mixedCompany()
      const s = run(rows)

      const logMean = (filter: (e: WageGapEmployeeInput) => boolean) => {
        const subset = rows.filter(filter)
        return (
          subset.reduce((t, e) => t + Math.log(e.hourlyWage), 0) / subset.length
        )
      }
      const expected =
        logMean((e) => e.gender === GenderEnum.MALE) -
        logMean((e) => e.gender !== GenderEnum.MALE)

      expect(Math.abs((s.rawGapLog ?? 0) - expected)).toBeLessThan(1e-9)
    })

    // The identity that replaced the fixed ±1,95% band: each employee's share
    // of the company gap is an identified quantity, not an approximation.
    it('Σ framlag ≡ óskýrt, exactly', () => {
      const s = run(mixedCompany())
      const sum = s.employees.reduce((t, e) => t + e.contributionLog, 0)

      expect(Math.abs(sum - (s.oskyrtLog ?? 0))).toBeLessThan(1e-9)
    })

    // Σ leif = 0 under OLS with an intercept — the reason the "óskýrt above the
    // threshold with nobody to correct" state is impossible.
    it('residuals sum to zero, so a gap always has at least one correctable driver', () => {
      const s = run(mixedCompany())
      const residualSum = s.employees.reduce((t, e) => t + e.residualLog, 0)

      expect(Math.abs(residualSum)).toBeLessThan(1e-9)
      expect(s.correctableCount).toBeGreaterThan(0)
    })

    it('óskýrt equals mean(leif | karlar) − mean(leif | konur)', () => {
      const s = run(mixedCompany())
      const side = (male: boolean) =>
        s.employees.filter((e) => (e.gender === GenderEnum.MALE) === male)
      const meanRes = (rows: typeof s.employees) =>
        rows.reduce((t, e) => t + e.residualLog, 0) / rows.length

      expect(
        Math.abs(meanRes(side(true)) - meanRes(side(false)) - (s.oskyrtLog ?? 0)),
      ).toBeLessThan(1e-9)
    })
  })

  describe('percentage conversion', () => {
    // ⚠️ The ordering is load-bearing: abs(convert(Δ)) ≠ convert(abs(Δ)), and a
    // direction-agnostic statutory test cannot report two different figures for
    // the same inequality.
    it('is symmetric under direction reversal', () => {
      const forward = gapPercentFromLog(Math.log(100 / 96))
      const reverse = gapPercentFromLog(Math.log(96 / 100))

      expect(forward.percent).toBeCloseTo(reverse.percent ?? 0, 10)
      expect(forward.direction).toBe('FEMALE')
      expect(reverse.direction).toBe('MALE')
    })

    it('uses the higher-paid group as the denominator', () => {
      // Karlar 100, konur 96 → 4,00% of men's pay, not 4,17% of women's.
      expect(gapPercentFromLog(Math.log(100 / 96)).percent).toBeCloseTo(4, 6)
    })

    it('reports arithmetic means for óleiðréttur, higher-paid base', () => {
      const { percent, direction } = gapPercentFromMeans(2875, 2798)

      expect(percent).toBeCloseTo(((2875 - 2798) / 2875) * 100, 10)
      expect(direction).toBe('FEMALE')
    })

    it('nulls rather than guesses on missing or non-positive input', () => {
      expect(gapPercentFromLog(null).percent).toBeNull()
      expect(gapPercentFromMeans(null, 2798).percent).toBeNull()
      expect(gapPercentFromMeans(0, 2798).percent).toBeNull()
    })

    it('carries both denominators, so the basis can be swapped in one line', () => {
      const s = run(mixedCompany())

      assertNumber(s.oskyrtPercent)
      assertNumber(s.oskyrtPercentLowerBase)

      // exp(|Δ|)−1 always exceeds 1−exp(−|Δ|) for a non-zero gap.
      expect(s.oskyrtPercentLowerBase).toBeGreaterThan(s.oskyrtPercent)
    })

    // The two displayed figures use different averages BY DESIGN and do not
    // decompose into one another.
    it('derives óleiðréttur from arithmetic means, not from the log gap', () => {
      const s = run(mixedCompany())

      expect(s.rawGapPercent).not.toBeCloseTo(s.rawGapPercentGeometric ?? 0, 6)
    })
  })

  describe('the lágmarksmengi', () => {
    it('reaches compliance and is drawn only from the underpaid disadvantaged side', () => {
      const s = run(mixedCompany())

      expect(s.oskyrtLogAfterMinimumSet).toBeLessThanOrEqual(s.thresholdLog)
      expect(s.minimumSetSize).toBeLessThanOrEqual(s.correctableCount)

      const members = s.employees.filter((e) => e.inMinimumSet)
      expect(
        members.every((e) => e.payStatus === PayStatusEnum.UNDERPAID),
      ).toBe(true)
      expect(
        members.every(
          (e) =>
            (e.gender === GenderEnum.MALE ? 'MALE' : 'FEMALE') ===
            s.disadvantagedGender,
        ),
      ).toBe(true)
    })

    it('never proposes lowering anyone: no overpaid employee is correctable', () => {
      const s = run(mixedCompany())

      expect(
        s.employees.filter((e) => e.payStatus === PayStatusEnum.OVERPAID),
      ).not.toHaveLength(0)
      expect(
        s.employees.some(
          (e) => e.isCorrectable && e.payStatus !== PayStatusEnum.UNDERPAID,
        ),
      ).toBe(false)
    })

    it('is empty when the company is already under the benchmark', () => {
      // Identical pay at identical scores ⇒ óskýrt 0.
      const s = run([
        employee(1, GenderEnum.MALE, 300, 4000),
        employee(2, GenderEnum.FEMALE, 300, 4000),
        employee(3, GenderEnum.MALE, 500, 5000),
        employee(4, GenderEnum.FEMALE, 500, 5000),
      ])

      expect(Math.abs(s.oskyrtLog ?? 1)).toBeLessThan(1e-9)
      expect(s.minimumSetSize).toBe(0)
    })

    // Direction-agnostic: the same machinery must work when MEN are underpaid.
    it('handles a men-underpaid company symmetrically', () => {
      const s = run([
        employee(1, GenderEnum.MALE, 200, 2700),
        employee(2, GenderEnum.MALE, 400, 3400),
        employee(3, GenderEnum.MALE, 600, 4100),
        employee(4, GenderEnum.FEMALE, 200, 3200),
        employee(5, GenderEnum.FEMALE, 400, 4000),
        employee(6, GenderEnum.FEMALE, 600, 4900),
      ])

      expect(s.disadvantagedGender).toBe('MALE')
      expect(s.oskyrtDirection).toBe('MALE')
      assertNumber(s.oskyrtLog)
      expect(s.oskyrtLog).toBeLessThan(0)

      // The identity must still hold with the sign intact.
      const sum = s.employees.reduce((t, e) => t + e.contributionLog, 0)
      expect(Math.abs(sum - s.oskyrtLog)).toBeLessThan(1e-9)
      expect(
        s.employees
          .filter((e) => e.inMinimumSet)
          .every((e) => e.gender === GenderEnum.MALE),
      ).toBe(true)
    })

    it('threshold in log points is the inverse of the displayed conversion', () => {
      // −log(1 − 0,039) = 0,0397809. (The plan quotes 0,039779, which is wrong
      // in the 6th decimal — the round-trip below is the property that matters.)
      expect(thresholdLogFor(3.9)).toBeCloseTo(0.0397809, 7)
      expect(gapPercentFromLog(thresholdLogFor(3.9)).percent).toBeCloseTo(3.9, 9)
    })
  })

  describe('availability gates', () => {
    it('blocks both tiers for a single-gender company, and says which cohort is empty', () => {
      const s = run([
        employee(1, GenderEnum.MALE, 300, 4000),
        employee(2, GenderEnum.MALE, 500, 5000),
      ])

      expect(s.rawGapAvailable).toBe(false)
      expect(s.oskyrtAvailable).toBe(false)
      expect(s.oskyrtBlockers).toContain(
        WageGapBlockerEnum.EMPTY_FEMALE_COHORT,
      )
      expect(s.oskyrtPercent).toBeNull()
      // ⚠️ counts stay real — they are the actionable half of the message.
      expect(s.counts).toEqual({ male: 2, female: 0, excluded: 0 })
    })

    it('never reports óskýrt available when the raw gap is not', () => {
      const s = run([employee(1, GenderEnum.FEMALE, 300, 4000)])

      expect(!s.rawGapAvailable && s.oskyrtAvailable).toBe(false)
    })

    // No cohort minimum anywhere: a 26/4 company gets the full analysis. The
    // alternative would auto-approve exactly the companies where one underpaid
    // employee moves the figure most.
    it('computes fully for a lopsided 26/4 company', () => {
      const rows: WageGapEmployeeInput[] = []
      for (let i = 1; i <= 26; i++) {
        rows.push(employee(i, GenderEnum.MALE, 200 + i * 10, 4000 + i * 20))
      }
      for (let i = 27; i <= 30; i++) {
        rows.push(employee(i, GenderEnum.FEMALE, 200 + i * 10, 3600 + i * 20))
      }
      const s = run(rows)

      expect(s.oskyrtAvailable).toBe(true)
      expect(s.oskyrtPercent).not.toBeNull()
      expect(s.counts).toEqual({ male: 26, female: 4, excluded: 0 })
    })

    it('bundles NEUTRAL into the female cohort', () => {
      const s = run([
        employee(1, GenderEnum.MALE, 300, 4000),
        employee(2, GenderEnum.NEUTRAL, 300, 3600),
      ])

      expect(s.counts).toEqual({ male: 1, female: 1, excluded: 0 })
      expect(s.rawGapAvailable).toBe(true)
    })

    it('excludes non-positive wages softly, counting and warning', () => {
      const s = run([
        ...mixedCompany(),
        employee(11, GenderEnum.FEMALE, 300, 0),
        employee(12, GenderEnum.MALE, 300, Number.NaN),
      ])

      expect(s.counts.excluded).toBe(2)
      expect(s.warnings).toContain(
        WageGapWarningEnum.ROWS_EXCLUDED_NON_POSITIVE_WAGE,
      )
      expect(s.oskyrtAvailable).toBe(true)
    })

    // ⚠️ With no score variation the pooled fit degenerates to intercept-only,
    // residuals become y − ȳ, and óskýrt collapses to exactly the raw gap. That
    // is the CORRECT answer — nothing is explained because there is nothing to
    // explain with — so it warns rather than blocking.
    it('collapses óskýrt to the raw gap when no score varies, rather than nulling', () => {
      const s = run([
        employee(1, GenderEnum.MALE, 300, 4400),
        employee(2, GenderEnum.MALE, 300, 4600),
        employee(3, GenderEnum.FEMALE, 300, 4000),
        employee(4, GenderEnum.FEMALE, 300, 4200),
      ])

      expect(s.oskyrtAvailable).toBe(true)
      expect(s.warnings).toContain(WageGapWarningEnum.NO_SCORE_VARIATION)
      expect(s.oskyrtLog).toBeCloseTo(s.rawGapLog ?? 0, 9)
    })

    it('warns when the cohorts share no score range at all', () => {
      const s = run([
        employee(1, GenderEnum.MALE, 700, 8000),
        employee(2, GenderEnum.MALE, 800, 9000),
        employee(3, GenderEnum.FEMALE, 200, 3000),
        employee(4, GenderEnum.FEMALE, 300, 3400),
      ])

      expect(s.warnings).toContain(WageGapWarningEnum.NO_SCORE_OVERLAP)
      // Still reported — full separation IS the finding, not a reason to hide it.
      expect(s.oskyrtAvailable).toBe(true)
    })
  })


  /**
   * Men and women are treated identically by construction. This block is the
   * proof: mirror every gender in a company and nothing about the MAGNITUDE may
   * change — only the direction label.
   *
   * It matters because the statutory test is direction-agnostic (a gap over 3,9%
   * requires an úrbótaáætlun whichever gender is underpaid), and because the two
   * obvious ways to get this wrong both look reasonable in code: taking
   * `abs()` of a converted percentage, and hardcoding women as the disadvantaged
   * group the way the reference script did.
   */
  describe('gender symmetry', () => {
    const mirror = (rows: WageGapEmployeeInput[]): WageGapEmployeeInput[] =>
      rows.map((e) => ({
        ...e,
        gender:
          e.gender === GenderEnum.MALE ? GenderEnum.FEMALE : GenderEnum.MALE,
      }))

    it.each([
      ['a mixed company', mixedCompany],
      ['a segregated company', segregatedCompany],
    ])('reports identical magnitudes with the direction flipped (%s)', (_, build) => {
      const forward = run(build())
      const mirrored = run(mirror(build()))

      assertNumber(forward.oskyrtPercent)
      assertNumber(mirrored.oskyrtPercent)
      assertNumber(forward.rawGapPercent)
      assertNumber(mirrored.rawGapPercent)

      // Magnitudes: bit-for-bit equal, not merely close.
      expect(mirrored.oskyrtPercent).toBeCloseTo(forward.oskyrtPercent, 12)
      expect(mirrored.rawGapPercent).toBeCloseTo(forward.rawGapPercent, 12)
      expect(mirrored.rawGapPercentGeometric).toBeCloseTo(
        forward.rawGapPercentGeometric ?? 0,
        12,
      )

      // Direction, and only direction, inverts.
      expect(mirrored.oskyrtDirection).not.toBe(forward.oskyrtDirection)
      expect(mirrored.disadvantagedGender).not.toBe(forward.disadvantagedGender)

      // The remedy is the same size, drawn from the other side.
      expect(mirrored.minimumSetSize).toBe(forward.minimumSetSize)
      expect(mirrored.correctableCount).toBe(forward.correctableCount)
    })

    it('mirrors the signed log gap exactly', () => {
      const forward = run(segregatedCompany())
      const mirrored = run(mirror(segregatedCompany()))

      assertNumber(forward.oskyrtLog)
      assertNumber(mirrored.oskyrtLog)

      expect(mirrored.oskyrtLog).toBeCloseTo(-forward.oskyrtLog, 12)
      expect(mirrored.rawGapLog).toBeCloseTo(-(forward.rawGapLog ?? 0), 12)
    })

    it('crosses the 3,9% benchmark at the same point in both directions', () => {
      // Built so óskýrt sits just above the line; the mirror must also be above.
      const rows = [
        employee(1, GenderEnum.MALE, 300, 4400),
        employee(2, GenderEnum.MALE, 500, 5400),
        employee(3, GenderEnum.FEMALE, 300, 4180),
        employee(4, GenderEnum.FEMALE, 500, 5130),
      ]
      const forward = run(rows)
      const mirrored = run(mirror(rows))

      assertNumber(forward.oskyrtPercent)
      assertNumber(mirrored.oskyrtPercent)

      expect(forward.oskyrtPercent > BENCHMARK).toBe(
        mirrored.oskyrtPercent > BENCHMARK,
      )
      expect(mirrored.minimumSetSize).toBe(forward.minimumSetSize)
    })

    // The one deliberate asymmetry in gender handling, recorded so it is not
    // mistaken for a bug: NEUTRAL is bundled into FEMALE, so the comparison is
    // M vs F+N. That is a product decision about a third category, not
    // differential treatment of men and women.
    it('bundles NEUTRAL into the female side rather than treating it separately', () => {
      const withNeutral = run([
        employee(1, GenderEnum.MALE, 300, 4400),
        employee(2, GenderEnum.MALE, 500, 5400),
        employee(3, GenderEnum.NEUTRAL, 300, 4180),
        employee(4, GenderEnum.FEMALE, 500, 5130),
      ])
      const asFemale = run([
        employee(1, GenderEnum.MALE, 300, 4400),
        employee(2, GenderEnum.MALE, 500, 5400),
        employee(3, GenderEnum.FEMALE, 300, 4180),
        employee(4, GenderEnum.FEMALE, 500, 5130),
      ])

      expect(withNeutral.oskyrtPercent).toBeCloseTo(
        asFemale.oskyrtPercent ?? 0,
        12,
      )
      expect(withNeutral.counts).toEqual(asFemale.counts)
    })
  })

  describe('reference conventions', () => {
    it('defaults to the Neumark pooled fit', () => {
      expect(run(mixedCompany()).pooledReferenceMode).toBe(
        PooledReferenceModeEnum.POOLED_OLS,
      )
    })

    it('gives a different explained term under the Fortin within-group variant', () => {
      const neumark = run(
        segregatedCompany(),
        PooledReferenceModeEnum.POOLED_OLS,
      )
      const fortin = run(
        segregatedCompany(),
        PooledReferenceModeEnum.WITH_DUMMY,
      )

      expect(neumark.twofold.explained).not.toBeCloseTo(
        fortin.twofold.explained ?? 0,
        9,
      )
      // Both must still satisfy the identity — see the identity block above.
      expect(fortin.rawGapLog).toBeCloseTo(neumark.rawGapLog ?? 0, 12)
      expect(
        Math.abs(
          (fortin.twofold.explained ?? 0) +
            (fortin.twofold.unexplained ?? 0) -
            (fortin.rawGapLog ?? 0),
        ),
      ).toBeLessThan(1e-9)
    })

    // Worth stating explicitly, because it is easy to read a zero here as a bug:
    // when both cohorts have the same score distribution there is nothing for
    // the score to explain, so the ENTIRE raw gap is unexplained.
    it('explains nothing when the cohorts have identical score composition', () => {
      const s = run(mixedCompany())

      expect(s.twofold.explained).toBeCloseTo(0, 9)
      expect(s.oskyrtLog).toBeCloseTo(s.rawGapLog ?? 0, 9)
    })

    // The mirror case, and the one that makes leiðréttur > óleiðréttur possible:
    // occupational segregation means score explains part of the raw gap.
    it('explains part of the gap when score composition differs', () => {
      const s = run(segregatedCompany())

      expect(Math.abs(s.twofold.explained ?? 0)).toBeGreaterThan(1e-6)
      expect(s.oskyrtLog).not.toBeCloseTo(s.rawGapLog ?? 0, 6)
    })
  })

  describe('rounding for persistence', () => {
    it('keeps 6dp on log points so the identity survives to display precision', () => {
      const rounded = roundWageGapDecompositionSnapshot(run(mixedCompany()))

      expect(
        Math.abs(
          (rounded.twofold.explained ?? 0) +
            (rounded.twofold.unexplained ?? 0) -
            (rounded.rawGapLog ?? 0),
        ),
      ).toBeLessThan(1e-5)
    })

    it('preserves the availability flags and counts through rounding', () => {
      const rounded = roundWageGapDecompositionSnapshot(
        run([employee(1, GenderEnum.MALE, 300, 4000)]),
      )

      expect(rounded.oskyrtAvailable).toBe(false)
      expect(rounded.counts).toEqual({ male: 1, female: 0, excluded: 0 })
      expect(rounded.oskyrtLog).toBeNull()
    })
  })
})
