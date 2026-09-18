import { GenderEnum } from '../models/report.model'
import {
  computeCompensationAggregates,
  computeSalaryAggregateSnapshot,
  computeSalaryRegression,
  computeSalaryScoreBucketSnapshots,
  getRegularHourlyWage,
  roundSalaryAggregateSnapshot,
  roundSalaryResultSnapshot,
} from './compensation-aggregates'
import { computeWageGapDecomposition } from './wage-gap-decomposition'

describe('compensation-aggregates', () => {
  /**
   * An employee paid entirely in incidental pay has no regluleg laun under
   * template 2.0, so their tímakaup is 0. These pin that such a sample is
   * EXCLUDED rather than averaged in — see `usableSalarySamples`.
   */
  describe('unusable samples (zero / non-finite tímakaup)', () => {
    it('leaves the cohort metrics untouched', () => {
      const real = [
        { gender: GenderEnum.MALE, salary: 4000 },
        { gender: GenderEnum.FEMALE, salary: 3000 },
      ]

      expect(
        computeSalaryAggregateSnapshot([
          ...real,
          { gender: GenderEnum.FEMALE, salary: 0 },
        ]),
      ).toEqual(computeSalaryAggregateSnapshot(real))
    })

    it('does not drag the minimum to zero', () => {
      const snapshot = computeSalaryAggregateSnapshot([
        { gender: GenderEnum.MALE, salary: 4000 },
        { gender: GenderEnum.MALE, salary: 0 },
      ])

      expect(snapshot.overall.minimum).toBe(4000)
      expect(snapshot.overall.average).toBe(4000)
    })

    it('excludes them from the cohort counts', () => {
      const buckets = computeSalaryScoreBucketSnapshots([
        { gender: GenderEnum.MALE, score: 150, salary: 4000 },
        { gender: GenderEnum.FEMALE, score: 150, salary: 0 },
      ])

      expect(buckets).toHaveLength(1)
      expect(buckets[0].counts).toEqual({
        overall: 1,
        male: 1,
        female: 0,
        neutral: 0,
      })
    })

    // Filtered before the range is derived, so an unusable sample at a distant
    // score cannot emit a bucket containing nobody.
    it('does not stretch the score range or emit an empty bucket', () => {
      const buckets = computeSalaryScoreBucketSnapshots([
        { gender: GenderEnum.MALE, score: 150, salary: 4000 },
        { gender: GenderEnum.FEMALE, score: 950, salary: 0 },
      ])

      expect(buckets).toHaveLength(1)
      expect(buckets[0].rangeFrom).toBe(100)
    })

    it('ignores non-finite salaries too', () => {
      const snapshot = computeSalaryAggregateSnapshot([
        { gender: GenderEnum.MALE, salary: 4000 },
        { gender: GenderEnum.FEMALE, salary: Number.NaN },
        { gender: GenderEnum.FEMALE, salary: Number.POSITIVE_INFINITY },
      ])

      expect(snapshot.overall.average).toBe(4000)
      expect(snapshot.female.average).toBeNull()
    })

    /**
     * ⚠️ **The invariant that matters.** `ReportResultService` feeds one
     * employee array to both the aggregates and the decomposition, and freezes
     * both onto the same `report_result` row. If only one of them filters, that
     * single row reports a decomposition excluding somebody next to averages
     * that include them at zero. This asserts the two agree on the population.
     */
    it('counts the same population as the wage-gap decomposition', () => {
      const employees = [
        { ordinal: 1, gender: GenderEnum.MALE, score: 200, hourlyWage: 4000 },
        { ordinal: 2, gender: GenderEnum.FEMALE, score: 300, hourlyWage: 3000 },
        { ordinal: 3, gender: GenderEnum.FEMALE, score: 250, hourlyWage: 0 },
      ]

      const decomposition = computeWageGapDecomposition({
        employees,
        benchmarkPercent: 3.9,
      })
      const snapshot = computeSalaryAggregateSnapshot(
        employees.map((e) => ({ gender: e.gender, salary: e.hourlyWage })),
      )
      // NEUTRAL is bundled into FEMALE on both sides, so male + female is the
      // whole counted population.
      const decompositionCounted =
        decomposition.counts.male + decomposition.counts.female
      const snapshotCounted = computeSalaryScoreBucketSnapshots(
        employees.map((e) => ({
          gender: e.gender,
          score: e.score,
          salary: e.hourlyWage,
        })),
      ).reduce((total, bucket) => total + bucket.counts.overall, 0)

      expect(decomposition.counts.excluded).toBe(1)
      expect(decompositionCounted).toBe(2)
      expect(snapshotCounted).toBe(decompositionCounted)
      // And the average is of the two usable wages, not three with a zero.
      expect(snapshot.overall.average).toBe(3500)
    })
  })

  it('bundles NEUTRAL into FEMALE for cohort metrics and wage gaps', () => {
    const snapshot = computeSalaryAggregateSnapshot([
      { gender: GenderEnum.MALE, salary: 100 },
      { gender: GenderEnum.MALE, salary: 300 },
      { gender: GenderEnum.FEMALE, salary: 150 },
      { gender: GenderEnum.FEMALE, salary: 250 },
      { gender: GenderEnum.NEUTRAL, salary: 50 },
    ])

    expect(snapshot.overall).toEqual({
      average: 170,
      median: 150,
      minimum: 50,
      maximum: 300,
    })
    expect(snapshot.male).toEqual({
      average: 200,
      median: 200,
      minimum: 100,
      maximum: 300,
    })
    // FEMALE absorbs the NEUTRAL salary (50): avg of 150/250/50 = 150.
    expect(snapshot.female).toEqual({
      average: 150,
      median: 150,
      minimum: 50,
      maximum: 250,
    })
    // Standalone NEUTRAL cohort is empty once bundled.
    expect(snapshot.neutral).toEqual({
      average: null,
      median: null,
      minimum: null,
      maximum: null,
    })

    expect(snapshot.salaryDifferences.maleFemale).toBe(25)
    expect(snapshot.salaryDifferences.femaleMale).toBeCloseTo(-33.3333, 3)
    expect(snapshot.salaryDifferences.maleNeutral).toBeNull()
    expect(snapshot.salaryDifferences.femaleNeutral).toBeNull()
    expect(snapshot.salaryDifferences.neutralMale).toBeNull()
    expect(snapshot.salaryDifferences.neutralFemale).toBeNull()
  })

  it('returns null for missing cohort metrics and wage gaps', () => {
    const snapshot = computeSalaryAggregateSnapshot([
      { gender: GenderEnum.MALE, salary: 100 },
      { gender: GenderEnum.MALE, salary: 200 },
    ])

    expect(snapshot.female).toEqual({
      average: null,
      median: null,
      minimum: null,
      maximum: null,
    })
    expect(snapshot.neutral).toEqual({
      average: null,
      median: null,
      minimum: null,
      maximum: null,
    })
    expect(snapshot.salaryDifferences).toEqual({
      maleFemale: null,
      maleNeutral: null,
      femaleMale: null,
      femaleNeutral: null,
      neutralMale: null,
      neutralFemale: null,
    })
  })

  it('rounds aggregate snapshots for persistence', () => {
    const rounded = roundSalaryAggregateSnapshot({
      overall: {
        average: 1.234,
        median: 2.345,
        minimum: 0.555,
        maximum: 9.999,
      },
      male: { average: 1.111, median: 2.222, minimum: 0.333, maximum: 9.444 },
      female: { average: null, median: null, minimum: null, maximum: null },
      neutral: { average: null, median: null, minimum: null, maximum: null },
      salaryDifferences: {
        maleFemale: 1.239,
        maleNeutral: null,
        femaleMale: null,
        femaleNeutral: null,
        neutralMale: null,
        neutralFemale: null,
      },
    })

    expect(rounded).toEqual({
      overall: { average: 1.23, median: 2.35, minimum: 0.56, maximum: 10 },
      male: { average: 1.11, median: 2.22, minimum: 0.33, maximum: 9.44 },
      female: { average: null, median: null, minimum: null, maximum: null },
      neutral: { average: null, median: null, minimum: null, maximum: null },
      salaryDifferences: {
        maleFemale: 1.24,
        maleNeutral: null,
        femaleMale: null,
        femaleNeutral: null,
        neutralMale: null,
        neutralFemale: null,
      },
    })
  })

  // ONE snapshot, on reglulegt tímakaup = (grunnlaun + viðbótarlaun) / greiddar
  // stundir. Aukagreiðslur are excluded, and so are the incidental hours that
  // earned them — `CompensationEmployeeInput` therefore carries no bonus field
  // at all, which is the strongest form the exclusion can take: it is not
  // possible to pass incidental pay in here and have it silently counted.
  // There is deliberately no base-pay-only counterpart either: `baseSalary /
  // paidHours` would divide base pay alone by a denominator that still includes
  // the FIXED overtime hours which earned the additional pay.
  it('computes one report-level hourly-wage snapshot with score buckets', () => {
    const aggregates = computeCompensationAggregates({
      employees: [
        {
          reportEmployeeRoleId: 'role-b',
          score: 120,
          gender: GenderEnum.MALE,
          // 500.000 regluleg laun over 200 klst → 2.500 kr./klst.
          paidHours: 200,
          baseSalary: 400000,
          additionalSalary: 100000,
        },
        {
          reportEmployeeRoleId: 'role-a',
          score: 220,
          gender: GenderEnum.FEMALE,
          // Part-time: 350.000 over 100 klst → 3.500 kr./klst. Note the HIGHER
          // hourly rate on the LOWER monthly pay — the whole point of the switch.
          paidHours: 100,
          baseSalary: 300000,
          additionalSalary: 50000,
        },
      ],
    })

    expect(aggregates.report.snapshot.totals.overall.average).toBe(3000)
    expect(aggregates.report.snapshot.scoreBuckets).toEqual([
      expect.objectContaining({
        rangeFrom: 100,
        rangeTo: 200,
        counts: { overall: 1, male: 1, female: 0, neutral: 0 },
        totals: expect.objectContaining({
          overall: expect.objectContaining({ average: 2500 }),
        }),
      }),
      expect.objectContaining({
        rangeFrom: 200,
        rangeTo: 300,
        counts: { overall: 1, male: 0, female: 1, neutral: 0 },
        totals: expect.objectContaining({
          overall: expect.objectContaining({ average: 3500 }),
        }),
      }),
    ])
  })

  it('rounds result snapshots including bucket totals', () => {
    const rounded = roundSalaryResultSnapshot({
      totals: {
        overall: {
          average: 1.234,
          median: 2.345,
          minimum: 0.555,
          maximum: 9.999,
        },
        male: { average: null, median: null, minimum: null, maximum: null },
        female: { average: null, median: null, minimum: null, maximum: null },
        neutral: { average: null, median: null, minimum: null, maximum: null },
        salaryDifferences: {
          maleFemale: null,
          maleNeutral: null,
          femaleMale: null,
          femaleNeutral: null,
          neutralMale: null,
          neutralFemale: null,
        },
      },
      scoreBuckets: [
        {
          rangeFrom: 0,
          rangeTo: 100,
          counts: { overall: 1, male: 1, female: 0, neutral: 0 },
          totals: {
            overall: {
              average: 10.555,
              median: 10.555,
              minimum: 10.555,
              maximum: 10.555,
            },
            male: { average: null, median: null, minimum: null, maximum: null },
            female: {
              average: null,
              median: null,
              minimum: null,
              maximum: null,
            },
            neutral: {
              average: null,
              median: null,
              minimum: null,
              maximum: null,
            },
            salaryDifferences: {
              maleFemale: null,
              maleNeutral: null,
              femaleMale: null,
              femaleNeutral: null,
              neutralMale: null,
              neutralFemale: null,
            },
          },
        },
      ],
    })

    expect(rounded.totals.overall).toEqual({
      average: 1.23,
      median: 2.35,
      minimum: 0.56,
      maximum: 10,
    })
    expect(rounded.scoreBuckets[0].totals.overall).toEqual({
      average: 10.56,
      median: 10.56,
      minimum: 10.56,
      maximum: 10.56,
    })
  })

  // The point of the whole switch to hourly: half the monthly pay for half the
  // hours is the SAME hourly rate. Under the old FTE divisor this pair was also
  // equal — but only because starfshlutfall happened to track hours, which is
  // exactly the assumption that failed for overtime.
  it('gives equal hourly wages for proportionally fewer hours', () => {
    const full = getRegularHourlyWage({
      paidHours: 200,
      baseSalary: 1000000,
      additionalSalary: 0,
    })
    const half = getRegularHourlyWage({
      paidHours: 100,
      baseSalary: 500000,
      additionalSalary: 0,
    })

    expect(full).toBe(5000)
    expect(half).toBe(5000)
  })

  describe('computeSalaryRegression', () => {
    // The chart's line, and the ONLY fit left in this module. Previously only
    // covered indirectly through the retired outlier analysis, so it kept its
    // coverage by accident — it now has its own.
    it('fits a level-space line through score vs hourly wage', () => {
      // 5.000 / 5.500 / 6.000 kr./klst. over scores 100/200/300.
      const regression = computeSalaryRegression([
        { score: 100, regularHourlyWage: 5000 },
        { score: 200, regularHourlyWage: 5500 },
        { score: 300, regularHourlyWage: 6000 },
      ])

      expect(regression.slope).toBeCloseTo(5, 4)
      expect(regression.intercept).toBeCloseTo(4500, 4)
      expect(regression.sampleCount).toBe(3)
      expect(regression.scoreMean).toBeCloseTo(200, 4)
      expect(regression.hourlyWageMean).toBeCloseTo(5500, 4)
      expect(regression.rSquared).toBeCloseTo(1, 6)
      expect(regression.scoreRangeFrom).toBe(100)
      expect(regression.scoreRangeTo).toBe(300)
    })

    it('reports no line for an empty sample', () => {
      const regression = computeSalaryRegression([])

      expect(regression.slope).toBeNull()
      expect(regression.intercept).toBeNull()
      expect(regression.sampleCount).toBe(0)
    })

    // ⚠️ The trap that made `xSumSquares` necessary: identical scores give a
    // degenerate fit, and this returns slope 0 — NOT null. Anything testing
    // identifiability must use `fitLinear().xSumSquares`, not `slope !== null`.
    it('returns slope 0, not null, when every score is identical', () => {
      const regression = computeSalaryRegression([
        { score: 250, regularHourlyWage: 5000 },
        { score: 250, regularHourlyWage: 6000 },
      ])

      expect(regression.slope).toBe(0)
      expect(regression.intercept).toBeCloseTo(5500, 4)
    })
  })
})
