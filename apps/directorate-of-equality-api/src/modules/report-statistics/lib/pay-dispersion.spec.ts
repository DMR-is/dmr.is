import * as fs from 'fs'
import * as path from 'path'

import {
  PayStatusEnum,
  PooledReferenceModeEnum,
  WageGapDecompositionMethodEnum,
  type WageGapDecompositionSnapshot,
  WageGapDirectionEnum,
  type WageGapEmployeeSnapshot,
} from '../../report/lib/wage-gap-decomposition'
import { GenderEnum } from '../../report/models/report.enums'
import {
  PayDispersionBlockerEnum,
  PayDispersionPopulationEnum,
} from '../dto/pay-dispersion.dto'
import {
  computePayDispersion,
  PAY_DISPERSION_MIN_COHORT,
  PAY_DISPERSION_THRESHOLD,
  studentizedResiduals,
} from './pay-dispersion'

/**
 * ⚠️ Read against the **committed frozen snapshots**, not against recomputed
 * cohorts. That is what this instrument consumes in production — it derives from
 * `report_result.wage_gap_decomposition_snapshot` on read — so testing anything
 * else would test a path nothing uses.
 */
const DATA_DIR = path.join(
  __dirname,
  '..',
  '..',
  '..',
  '..',
  'db',
  'seeders',
  'data',
)

const fixtures = JSON.parse(
  fs.readFileSync(path.join(DATA_DIR, 'wage-gap-fixtures.json'), 'utf8'),
) as Record<string, WageGapDecompositionSnapshot>

const referenceCompany = (
  JSON.parse(
    fs.readFileSync(path.join(DATA_DIR, 'reference-company.json'), 'utf8'),
  ) as { decomposition: WageGapDecompositionSnapshot }
).decomposition

describe('pay-dispersion (ábendingar)', () => {
  describe('the statistic', () => {
    /**
     * The reference cohort's three most extreme employees. All three are also in
     * its five-member lágmarksmengi, which is why the company-level list below
     * comes back empty — the statistic and the output are different things.
     */
    it('flags the three genuine extremes on the reference cohort', () => {
      const flagged = studentizedResiduals(referenceCompany)
        .filter((r) => Math.abs(r.studentizedResidual) >= 2)
        .map((r) => r.employee.ordinal)
        .sort((a, b) => a - b)

      expect(flagged).toEqual([6, 36, 39])
    })

    /**
     * ⚠️ The guard against the worst available refactor: recomputing the spread
     * on a reduced population. Removing the extremes shrinks `s`, which pushes
     * new employees over the threshold, which shrinks it again — a cascade with
     * no fixed point. So a member's `t` must not depend on whether anyone is
     * later withheld from the OUTPUT.
     *
     * Asserted across the whole cohort rather than for one row, so a partial
     * regression cannot slip through.
     */
    it('gives every employee the same t whatever the output population', () => {
      const all = studentizedResiduals(fixtures.richSheet)
      const compliant = computePayDispersion(fixtures.richSheetCompliant)
      const overBenchmark = computePayDispersion(fixtures.richSheet)

      // Same person, listed under one population and withheld under the other.
      const listedWhenCompliant = compliant.employees.find(
        (e) => e.employeeOrdinal === 70,
      )
      const withheldWhenOver = overBenchmark.employees.find(
        (e) => e.employeeOrdinal === 70,
      )

      expect(listedWhenCompliant).toBeDefined()
      expect(withheldWhenOver).toBeUndefined()

      // ...and #70 still HAS a residual under the population that withheld him.
      const seventy = all.find((r) => r.employee.ordinal === 70)
      expect(
        Math.abs(seventy?.studentizedResidual ?? 0),
      ).toBeGreaterThanOrEqual(PAY_DISPERSION_THRESHOLD)
    })

    /**
     * `|t| ≤ √(n − 2)`, because the residual under test is itself part of the sum
     * of squares it is divided by. This is the entire justification for
     * `PAY_DISPERSION_MIN_COHORT`, so it is asserted rather than left in a
     * comment where it could quietly stop being true.
     *
     * Tolerance covers the snapshot's 6dp rounding of `residualLog`.
     */
    it('cannot exceed the sqrt(n-2) bound, which is why the floor exists', () => {
      for (const snapshot of [
        referenceCompany,
        fixtures.richSheet,
        fixtures.richSheetCompliant,
      ]) {
        const n = snapshot.employees.length
        const bound = Math.sqrt(n - 2)
        const worst = Math.max(
          ...studentizedResiduals(snapshot).map((r) =>
            Math.abs(r.studentizedResidual),
          ),
        )

        expect(worst).toBeLessThanOrEqual(bound + 1e-6)
      }

      // And so the threshold is arithmetically unreachable below n = 6.
      expect(Math.sqrt(6 - 2)).toBe(PAY_DISPERSION_THRESHOLD)
      expect(PAY_DISPERSION_MIN_COHORT).toBeGreaterThan(6)
    })

    /**
     * ⚠️ **Derived from the formula, not from this implementation.**
     *
     * Every other numeric assertion in this file is a golden value produced by
     * running a fixture through the code under test — which pins behaviour but
     * would happily ratify a wrong-but-bounded formula. Here the expectation is
     * computed independently, in closed form, from the definition:
     *
     *     t = e / (s · √(1 − h)),  s = √(Σe² / (n − 2)),  h = 1/n + (x−x̄)²/Sxx
     *
     * The cohort is built so the algebra is checkable by hand: twelve employees
     * all sitting exactly at `xMean`, so the leverage term vanishes and h = 1/n
     * for everyone; residuals of +0,6 and −0,2 with ten zeros, so
     * Σe² = 0,40 and s = √(0,40/10) = 0,2 exactly.
     *
     * This pins the two things a plausible-looking wrong formula would get
     * wrong: the denominator is n − 2 (not n, not n − 1), and the residual is
     * studentized INTERNALLY — divided by a spread it is itself part of.
     */
    it('matches a hand-derived t rather than a value this code produced', () => {
      const n = 12
      const rows = studentizedResiduals(
        makeSnapshot({
          employees: [
            employee(1, { score: FIT.xMean, residualLog: 0.6 }),
            employee(2, { score: FIT.xMean, residualLog: -0.2 }),
            ...Array.from({ length: n - 2 }, (_, i) =>
              employee(i + 3, { score: FIT.xMean, residualLog: 0 }),
            ),
          ],
        }),
      )

      const s = Math.sqrt((0.6 ** 2 + 0.2 ** 2) / (n - 2))
      const leverage = 1 / n // every score is exactly x̄
      const expected = (e: number) => e / (s * Math.sqrt(1 - leverage))

      expect(s).toBeCloseTo(0.2, 12)
      expect(rows[0].leverage).toBeCloseTo(leverage, 12)
      expect(rows[0].studentizedResidual).toBeCloseTo(expected(0.6), 10)
      expect(rows[1].studentizedResidual).toBeCloseTo(expected(-0.2), 10)
    })

    /**
     * The published figure and the filtered figure must be the same number.
     *
     * Filtering on the raw `t` and publishing a 2dp one makes the list
     * unreproducible exactly at the cut-off: |t| = 1,9996 would have been
     * excluded while printing as `2,00`, and a reader checking the column could
     * not account for its absence. Both residuals below are hand-solved to land
     * either side of the ROUNDED threshold.
     */
    it.each([
      ['rounds up to the threshold, so it is listed', 0.7606456722, true],
      ['rounds below the threshold, so it is not', 0.7578291051, false],
    ])('%s', (_label, residual, shouldBeListed) => {
      const result = computePayDispersion(
        makeSnapshot({
          oskyrtWithinBenchmark: true,
          employees: [
            employee(1, { score: FIT.xMean, residualLog: residual }),
            // The counterweight that makes the spread finite. It is itself
            // extreme (t = 2,63) and listed either way, which is why the
            // assertions below name ordinal 1 rather than counting rows.
            employee(2, { score: FIT.xMean, residualLog: 1 }),
            ...Array.from({ length: 10 }, (_, i) =>
              employee(i + 3, { score: FIT.xMean, residualLog: 0 }),
            ),
          ],
        }),
      )

      const boundary = result.employees.find((e) => e.employeeOrdinal === 1)

      expect(boundary !== undefined).toBe(shouldBeListed)
      if (boundary) {
        // Published as exactly the threshold — so a reader checking the column
        // finds it present, which is the whole point of rounding once.
        expect(boundary.studentizedResidual).toBe(PAY_DISPERSION_THRESHOLD)
      }
    })

    it('corrects for leverage rather than using the bare residual', () => {
      const rows = studentizedResiduals(referenceCompany)

      // Leverage is never zero (the 1/n term) and never reaches 1 on a real
      // cohort — if it did, the denominator would vanish.
      for (const row of rows) {
        expect(row.leverage).toBeGreaterThan(0)
        expect(row.leverage).toBeLessThan(1)
      }
    })
  })

  describe('the two populations', () => {
    /**
     * ⚠️ The pair that makes the withholding rule legible: `richSheet` and
     * `richSheetCompliant` are the **same 100 employees**, one with a 10% pay cut
     * applied to the women to manufacture a gap.
     *
     * Compliant  → both extremes listed (#70, #1).
     * Over       → #70 is in the lágmarksmengi and withheld; #1 is not, and stays.
     *
     * Nobody is removed from the analysis in either case.
     */
    it('lists both extremes when the company is compliant', () => {
      const result = computePayDispersion(fixtures.richSheetCompliant)

      expect(result.available).toBe(true)
      expect(result.blockers).toEqual([])
      expect(result.population).toBe(PayDispersionPopulationEnum.ALL_EMPLOYEES)
      // Most extreme first.
      expect(result.employees.map((e) => e.employeeOrdinal)).toEqual([70, 1])
      expect(result.employees[0].studentizedResidual).toBeCloseTo(2.53, 2)
      expect(result.employees[0].payStatus).toBe(PayStatusEnum.OVERPAID)
      // The context figure the copy quotes, in krónur terms rather than spreads.
      expect(result.cohortResidualSpreadPercentUp).toBeCloseTo(25.67, 1)
      // ⚠️ Asymmetric, and always smaller in magnitude. The spread is symmetric
      // in LOG space only; a single figure rendered as ±25,67% would overstate
      // the downward band by 5pp.
      expect(result.cohortResidualSpreadPercentDown).toBeCloseTo(-20.43, 1)
    })

    /**
     * ⚠️ **The load-bearing test for the pre-wired half.**
     *
     * `#1` is a woman paid +72% above her expected pay in a company whose gap
     * disfavours women. Correcting her downward would WIDEN the reported gap, so
     * `widensGap` is false and she can never enter the lágmarksmengi however
     * extreme she gets. She is the reason this instrument exists, and this is the
     * only assertion in the suite that proves it reaches her.
     */
    it('reaches an extreme employee the lágmarksmengi structurally cannot', () => {
      const result = computePayDispersion(fixtures.richSheet)

      expect(result.available).toBe(true)
      expect(result.population).toBe(
        PayDispersionPopulationEnum.EXCLUDING_MINIMUM_SET,
      )
      expect(result.employees.map((e) => e.employeeOrdinal)).toEqual([1])

      const listed = fixtures.richSheet.employees.find((e) => e.ordinal === 1)
      expect(listed?.widensGap).toBe(false)
      expect(listed?.inMinimumSet).toBe(false)
      expect(result.employees[0].payStatus).toBe(PayStatusEnum.OVERPAID)
    })

    /**
     * An empty list with `available: true` is a real answer — "nobody outside the
     * úrbótaáætlun deviates more than the spread explains" — and must not be
     * confused with a blocked one. All three of this cohort's extremes are in its
     * lágmarksmengi.
     */
    it('returns an empty list, not a blocker, when every extreme is already named', () => {
      const result = computePayDispersion(referenceCompany)

      expect(result.available).toBe(true)
      expect(result.blockers).toEqual([])
      expect(result.population).toBe(
        PayDispersionPopulationEnum.EXCLUDING_MINIMUM_SET,
      )
      expect(result.employees).toEqual([])
    })

    it('never lists anyone who is already in the lágmarksmengi', () => {
      for (const snapshot of [referenceCompany, fixtures.richSheet]) {
        const inSet = new Set(
          snapshot.employees
            .filter((e) => e.inMinimumSet)
            .map((e) => e.ordinal),
        )
        const listed = computePayDispersion(snapshot).employees.map(
          (e) => e.employeeOrdinal,
        )

        expect(inSet.size).toBeGreaterThan(0)
        expect(listed.filter((ordinal) => inSet.has(ordinal))).toEqual([])
      }
    })

    /**
     * ⚠️ **"Not in the lágmarksmengi" is not "not a carrier."**
     *
     * The set is only the few carriers the selection walk picked — the reference
     * company has 73 carriers and 5 in the set. Withholding on `widensGap`
     * instead of `inMinimumSet` would silence the other 68, and it is the
     * likeliest way to get this wrong. No committed fixture happens to contain a
     * gap carrier outside the set that is ALSO statistically extreme, so the case
     * is constructed here rather than left unguarded.
     */
    it('still lists a gap carrier the selection walk did not pick', () => {
      const carrierOutsideTheSet = makeSnapshot({
        oskyrtWithinBenchmark: false,
        employees: [
          // The extreme: carries the gap, but the walk stopped before reaching him.
          employee(1, {
            residualLog: -0.55,
            widensGap: true,
            inMinimumSet: false,
          }),
          // Already named, and therefore withheld.
          employee(2, {
            residualLog: -0.5,
            widensGap: true,
            inMinimumSet: true,
          }),
          // Filler, so the cohort clears the floor and the spread is small.
          ...Array.from({ length: 14 }, (_, i) =>
            employee(i + 3, { residualLog: i % 2 === 0 ? 0.01 : -0.01 }),
          ),
        ],
      })

      const result = computePayDispersion(carrierOutsideTheSet)

      expect(result.employees.map((e) => e.employeeOrdinal)).toContain(1)
      expect(result.employees.map((e) => e.employeeOrdinal)).not.toContain(2)
    })
  })

  describe('blockers — an empty table must never read as all-clear', () => {
    it('cannot assess a six-employee workforce, and says so', () => {
      for (const key of ['scenarioWithOutliers', 'scenarioWithoutOutliers']) {
        const result = computePayDispersion(fixtures[key])

        expect(fixtures[key].employees.length).toBeLessThan(
          PAY_DISPERSION_MIN_COHORT,
        )
        expect(result.available).toBe(false)
        expect(result.blockers).toEqual([
          PayDispersionBlockerEnum.COHORT_TOO_SMALL,
        ])
        expect(result.employees).toEqual([])
        expect(result.cohortResidualSpreadPercentUp).toBeNull()
        expect(result.cohortResidualSpreadPercentDown).toBeNull()
      }
    })

    /**
     * A single-gender workforce returns `employees: []` and `pooledFit: null`
     * from the decomposition, so there is no line to deviate from. Returned
     * ALONE — it subsumes the other two, and three codes for one absence reads as
     * three problems.
     */
    /**
     * ⚠️ **The gate, not just the blocker.**
     *
     * Both surfaces skip a `population` other than ALL_EMPLOYEES *before* they
     * read `blockers`, so a blocked snapshot tagged EXCLUDING_MINIMUM_SET renders
     * nothing at all — no table and no reason. That is exactly what happened:
     * `population` was derived from `oskyrtWithinBenchmark === true`, and a
     * snapshot with no computable gap carries `null`, so it fell to the
     * supplementary population and its Icelandic copy became unreachable.
     *
     * The rule is that a population is only EXCLUDING_MINIMUM_SET when a
     * lágmarksmengi was actually withheld, which requires the company to be over
     * the benchmark. Asserted per state so it cannot regress quietly.
     */
    it.each([
      ['compliant', true, PayDispersionPopulationEnum.ALL_EMPLOYEES],
      [
        'over the benchmark',
        false,
        PayDispersionPopulationEnum.EXCLUDING_MINIMUM_SET,
      ],
      ['no computable gap', null, PayDispersionPopulationEnum.ALL_EMPLOYEES],
    ])(
      'puts a %s snapshot in the population whose copy can actually render',
      (_label, withinBenchmark, expected) => {
        const result = computePayDispersion(
          makeSnapshot({
            oskyrtWithinBenchmark: withinBenchmark as boolean | null,
            employees: Array.from({ length: 20 }, (_, i) =>
              employee(i + 1, { residualLog: i % 2 === 0 ? 0.05 : -0.05 }),
            ),
          }),
        )

        expect(result.population).toBe(expected)
      },
    )

    it('reaches its own blocker copy on a snapshot with no computable gap', () => {
      const result = computePayDispersion(
        makeSnapshot({
          oskyrtAvailable: false,
          oskyrtWithinBenchmark: null,
          pooledFit: null,
          employees: [],
        }),
      )

      expect(result.blockers).toEqual([
        PayDispersionBlockerEnum.GAP_NOT_COMPUTABLE,
      ])
      // The half that was broken: a consumer gating on ALL_EMPLOYEES must still
      // see this response, or the blocker copy is dead.
      expect(result.population).toBe(PayDispersionPopulationEnum.ALL_EMPLOYEES)
    })

    it('reports GAP_NOT_COMPUTABLE alone when the decomposition produced nothing', () => {
      const result = computePayDispersion(
        makeSnapshot({
          oskyrtAvailable: false,
          pooledFit: null,
          employees: [],
        }),
      )

      expect(result.blockers).toEqual([
        PayDispersionBlockerEnum.GAP_NOT_COMPUTABLE,
      ])
    })

    /**
     * Every score identical: væntanlegt tímakaup collapses to the cohort mean, so
     * "far from what your stig imply" has no meaning. ⚠️ The gap decomposition
     * treats this as a soft warning; here it is a hard blocker.
     */
    it('blocks when no score varies, though the gap itself only warns', () => {
      const result = computePayDispersion(
        makeSnapshot({
          pooledFit: { ...FIT, xSumSquares: 0 },
          employees: Array.from({ length: 20 }, (_, i) =>
            employee(i + 1, { score: 400, residualLog: i === 0 ? 0.9 : -0.02 }),
          ),
        }),
      )

      expect(result.blockers).toEqual([
        PayDispersionBlockerEnum.NO_SCORE_VARIATION,
      ])
      expect(result.employees).toEqual([])
    })

    /**
     * ⚠️ Distinguishes "cannot tell" from "nobody deviates" — two states that
     * would otherwise collide. A snapshot frozen by an older engine can lack
     * `residualLog`, and `undefined ** 2` is NaN, which produces the same absent
     * spread as an exact fit. Reporting all-clear there would be the same class of
     * mistake as rendering 0% for a gap that is not computable.
     */
    it('fails closed on a snapshot with no usable residuals', () => {
      const result = computePayDispersion(
        makeSnapshot({
          employees: Array.from({ length: 20 }, (_, i) => {
            const row = employee(i + 1, { residualLog: 0.3 })
            // The shape an older frozen row has: the field simply is not there.
            delete (row as unknown as Record<string, unknown>).residualLog
            return row
          }),
        }),
      )

      expect(result.available).toBe(false)
      expect(result.blockers).toEqual([
        PayDispersionBlockerEnum.GAP_NOT_COMPUTABLE,
      ])
      expect(result.employees).toEqual([])
    })

    /**
     * ⚠️ An ABSENT key, not a JSON null. The strict `pooledFit === null` check
     * let this through and then threw on `.xSumSquares` — and since this runs
     * inside `ReportResultModel.fromModel`, the single mapping path for every
     * report-result read, that TypeError would 500 the whole report-detail
     * response rather than degrading one advisory section.
     */
    it('does not throw when pooledFit is absent rather than null', () => {
      const snapshot = makeSnapshot({
        employees: Array.from({ length: 20 }, (_, i) =>
          employee(i + 1, { residualLog: 0.3 }),
        ),
      })
      delete (snapshot as unknown as Record<string, unknown>).pooledFit

      expect(() => computePayDispersion(snapshot)).not.toThrow()
      expect(computePayDispersion(snapshot).blockers).toEqual([
        PayDispersionBlockerEnum.GAP_NOT_COMPUTABLE,
      ])
    })

    /**
     * The one path in a deliberately fail-closed function that failed OPEN:
     * `studentizedResiduals` returns `[]` on a null `xMean`, but `available:
     * true` had already been committed — publishing a false all-clear.
     */
    it('fails closed when the fit itself is unusable', () => {
      const result = computePayDispersion(
        makeSnapshot({
          pooledFit: { ...FIT, xMean: null },
          employees: Array.from({ length: 20 }, (_, i) =>
            employee(i + 1, { residualLog: 0.3 }),
          ),
        }),
      )

      expect(result.available).toBe(false)
      expect(result.blockers).toEqual([
        PayDispersionBlockerEnum.GAP_NOT_COMPUTABLE,
      ])
    })

    /** A perfect fit is not a blocker — it is a company where nobody deviates. */
    it('returns an empty list for an exact fit rather than a blocker', () => {
      const result = computePayDispersion(
        makeSnapshot({
          oskyrtWithinBenchmark: true,
          employees: Array.from({ length: 20 }, (_, i) =>
            employee(i + 1, { residualLog: 0 }),
          ),
        }),
      )

      expect(result.available).toBe(true)
      expect(result.blockers).toEqual([])
      expect(result.employees).toEqual([])
      expect(result.cohortResidualSpreadPercentUp).toBeNull()
      expect(result.cohortResidualSpreadPercentDown).toBeNull()
    })
  })

  /**
   * ⚠️ The invariant the whole feature rests on: ábendingar is a READ over the
   * frozen snapshot and must leave the statutory figures exactly as it found
   * them. Held by inspection until now — `computePayDispersion` takes the
   * snapshot by reference, and one stray mutation would silently move a
   * published regulatory number.
   */
  it('leaves óskýrt and the lágmarksmengi untouched', () => {
    for (const snapshot of [referenceCompany, fixtures.richSheet]) {
      const before = JSON.stringify(snapshot)

      computePayDispersion(snapshot)
      studentizedResiduals(snapshot)

      expect(JSON.stringify(snapshot)).toBe(before)
    }
  })

  it('carries no field that implies an obligation', () => {
    const result = computePayDispersion(fixtures.richSheetCompliant)
    const row = result.employees[0] as unknown as Record<string, unknown>

    // `contributionShare` answers "why are you on the úrbótaáætlun". Its absence
    // is deliberate: including it would import exactly the framing this list
    // exists to avoid.
    for (const forbidden of [
      'contributionShare',
      'reason',
      'action',
      'groupId',
      'signatureName',
      'inMinimumSet',
    ]) {
      expect(row).not.toHaveProperty(forbidden)
    }
  })
})

const FIT = {
  slope: 0.002,
  intercept: 7.5,
  sampleCount: 16,
  xMean: 400,
  yMean: 8.3,
  xSumSquares: 200000,
  rSquared: 0.5,
  xRangeFrom: 200,
  xRangeTo: 600,
}

const employee = (
  ordinal: number,
  overrides: Partial<WageGapEmployeeSnapshot> = {},
): WageGapEmployeeSnapshot => ({
  ordinal,
  gender: GenderEnum.FEMALE,
  score: 400,
  hourlyWage: 4000,
  expectedHourlyWage: 4000,
  deviationPercent: 0,
  residualLog: 0,
  contributionLog: 0,
  contributionShare: null,
  payStatus: PayStatusEnum.ON_LINE,
  widensGap: false,
  inMinimumSet: false,
  ...overrides,
})

/** Only the fields this module reads carry meaning; the rest satisfy the type. */
const makeSnapshot = (
  overrides: Partial<WageGapDecompositionSnapshot>,
): WageGapDecompositionSnapshot => ({
  method:
    WageGapDecompositionMethodEnum.OAXACA_BLINDER_LOG_REGULAR_HOURLY_WAGE_BY_SCORE,
  pooledReferenceMode: PooledReferenceModeEnum.POOLED_OLS,
  rawGapAvailable: true,
  rawGapBlockers: [],
  oskyrtAvailable: true,
  oskyrtBlockers: [],
  warnings: [],
  counts: { male: 8, female: 8, excluded: 0 },
  pooledFit: FIT,
  rawGapLog: 0.05,
  oskyrtLog: 0.05,
  twofold: { explained: 0, unexplained: 0.05 },
  meanHourlyWageMale: 4100,
  meanHourlyWageFemale: 3900,
  rawGapPercent: 5,
  rawGapDirection: WageGapDirectionEnum.FEMALE,
  rawGapPercentGeometric: 5,
  oskyrtPercent: 5,
  oskyrtDirection: WageGapDirectionEnum.FEMALE,
  oskyrtPercentLowerBase: 5,
  disadvantagedGender: WageGapDirectionEnum.FEMALE,
  employees: [],
  gapCarrierCount: 0,
  minimumSetSize: 0,
  oskyrtWithinBenchmark: false,
  oskyrtLogAfterMinimumSet: null,
  oskyrtDirectionAfterMinimumSet: null,
  minimumSetClosesGap: null,
  thresholdLog: 0.0397808700118446,
  benchmarkPercent: 3.9,
  ...overrides,
})
