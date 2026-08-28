import { GenderEnum } from '../models/report.model'
import {
  computeCompensationAggregates,
  computeSalaryAggregateSnapshot,
  computeSalaryRegression,
  getRegularHourlyWage,
  roundSalaryAggregateSnapshot,
  roundSalaryResultSnapshot,
} from './compensation-aggregates'

describe('compensation-aggregates', () => {
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

  // ONE snapshot, on reglulegt tímakaup. There is deliberately no base-pay-only
  // counterpart: `baseSalary / paidHours` would divide base pay alone by a
  // denominator that includes the overtime hours which earned the additional and
  // bonus pay. Under the old FTE divisor both variants were coherent; under an
  // hours divisor only the total-pay numerator is.
  it('computes one report-level hourly-wage snapshot with score buckets', () => {
    const aggregates = computeCompensationAggregates({
      employees: [
        {
          reportEmployeeRoleId: 'role-b',
          score: 120,
          gender: GenderEnum.MALE,
          // 550.000 regluleg laun over 200 klst → 2.750 kr./klst.
          paidHours: 200,
          baseSalary: 400000,
          additionalSalary: 100000,
          bonusSalary: 50000,
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
          bonusSalary: null,
        },
      ],
    })

    expect(aggregates.report.snapshot.totals.overall.average).toBe(3125)
    expect(aggregates.report.snapshot.scoreBuckets).toEqual([
      expect.objectContaining({
        rangeFrom: 100,
        rangeTo: 200,
        counts: { overall: 1, male: 1, female: 0, neutral: 0 },
        totals: expect.objectContaining({
          overall: expect.objectContaining({ average: 2750 }),
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

  it('treats a null bonusSalary as zero in the hourly rate', () => {
    const aggregates = computeCompensationAggregates({
      employees: [
        {
          reportEmployeeRoleId: 'role-a',
          score: 100,
          gender: GenderEnum.MALE,
          paidHours: 100,
          baseSalary: 300000,
          additionalSalary: 50000,
          bonusSalary: null,
        },
      ],
    })

    expect(aggregates.report.snapshot.totals.overall.average).toBe(3500)
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
      bonusSalary: null,
    })
    const half = getRegularHourlyWage({
      paidHours: 100,
      baseSalary: 500000,
      additionalSalary: 0,
      bonusSalary: null,
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
