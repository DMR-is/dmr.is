import { GenderEnum } from '../models/report.model'
import {
  assessSalaryOutlierFromPrediction,
  computeCompensationAggregates,
  computeSalaryAggregateSnapshot,
  computeSalaryOutlierAnalysis,
  detectOutliers,
  type OutlierDetectionEmployee,
  roundSalaryAggregateSnapshot,
  roundSalaryResultSnapshot,
} from './compensation-aggregates'

/**
 * A full month with some overtime. Fixtures express pay as a monthly figure and
 * divide by this, so `baseSalary / FIXTURE_PAID_HOURS` reads as a plausible
 * kr./klst. rate. Using 1 here would make every assertion pass while asserting
 * a 1.000.000 kr/hour wage.
 */
const FIXTURE_PAID_HOURS = 200

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

  it('marks salaries outside half the threshold from a prediction as outliers', () => {
    expect(
      assessSalaryOutlierFromPrediction({
        salary: 102000,
        predictedSalary: 100000,
        allowedDifferencePercent: 1.95,
      }),
    ).toMatchObject({
      isOutlier: true,
      direction: 'ABOVE',
      allowedDifferencePercent: 1.95,
      predictedSalary: 100000,
    })

    expect(
      assessSalaryOutlierFromPrediction({
        salary: 98100,
        predictedSalary: 100000,
        allowedDifferencePercent: 1.95,
      }),
    ).toMatchObject({
      isOutlier: false,
      direction: 'BELOW',
      allowedDifferencePercent: 1.95,
    })
  })

  it('computes a regression analysis with a predicted hourly wage per exact score', () => {
    const analysis = computeSalaryOutlierAnalysis({
      thresholdPercent: 3.9,
      employees: [
        makeOutlierEmployee({ ordinal: 1, score: 100, baseSalary: 1000000 }),
        makeOutlierEmployee({ ordinal: 2, score: 200, baseSalary: 1100000 }),
        makeOutlierEmployee({ ordinal: 3, score: 300, baseSalary: 1200000 }),
      ],
    })

    // 5.000 / 5.500 / 6.000 kr./klst. over scores 100/200/300.
    expect(analysis.regressions.overall.slope).toBeCloseTo(5, 4)
    expect(analysis.regressions.overall.intercept).toBeCloseTo(4500, 4)
    expect(analysis.employees[1]).toMatchObject({
      ordinal: 2,
      score: 200,
      regularHourlyWage: 5500,
      predictedHourlyWage: 5500,
      isOutlier: false,
    })
  })

  it('snapshots per-gender regressions for visualisation', () => {
    const analysis = computeSalaryOutlierAnalysis({
      thresholdPercent: 3.9,
      employees: [
        makeOutlierEmployee({
          ordinal: 1,
          score: 100,
          gender: GenderEnum.FEMALE,
          baseSalary: 800000,
        }),
        makeOutlierEmployee({
          ordinal: 2,
          score: 200,
          gender: GenderEnum.FEMALE,
          baseSalary: 900000,
        }),
        makeOutlierEmployee({
          ordinal: 3,
          score: 100,
          gender: GenderEnum.MALE,
          baseSalary: 1000000,
        }),
        makeOutlierEmployee({
          ordinal: 4,
          score: 200,
          gender: GenderEnum.MALE,
          baseSalary: 1100000,
        }),
      ],
    })

    expect(analysis.regressions.female.sampleCount).toBe(2)
    expect(analysis.regressions.female.slope).toBeCloseTo(5, 4)
    expect(analysis.regressions.male.sampleCount).toBe(2)
    expect(analysis.regressions.male.slope).toBeCloseTo(5, 4)
    expect(analysis.regressions.male.intercept).toBeCloseTo(4500, 4)
    expect(analysis.regressions.female.intercept).toBeCloseTo(3500, 4)
    expect(analysis.regressions.neutral.sampleCount).toBe(0)
    expect(analysis.regressions.neutral.slope).toBeNull()
  })

  describe('detectOutliers', () => {
    const baseEmployee = (
      overrides: Partial<OutlierDetectionEmployee>,
    ): OutlierDetectionEmployee => ({
      ordinal: 0,
      score: 100,
      gender: GenderEnum.FEMALE,
      paidHours: FIXTURE_PAID_HOURS,
      baseSalary: 1000000,
      additionalSalary: 0,
      bonusSalary: null,
      ...overrides,
    })

    const regressionEmployees = () => [
      baseEmployee({ ordinal: 1, score: 100, baseSalary: 850000 }),
      baseEmployee({ ordinal: 2, score: 200, baseSalary: 1000000 }),
      baseEmployee({ ordinal: 3, score: 300, baseSalary: 1100000 }),
      baseEmployee({ ordinal: 4, score: 400, baseSalary: 1200000 }),
      baseEmployee({ ordinal: 5, score: 500, baseSalary: 1300000 }),
      baseEmployee({ ordinal: 6, score: 600, baseSalary: 1400000 }),
      baseEmployee({ ordinal: 7, score: 700, baseSalary: 1500000 }),
    ]

    it('returns employees whose hourly wage deviates beyond the half-threshold band around the regression prediction', () => {
      const outliers = detectOutliers({
        thresholdPercent: 3.9,
        employees: regressionEmployees(),
      })

      expect(outliers).toHaveLength(1)
      expect(outliers[0]).toMatchObject({
        ordinal: 1,
        score: 100,
        regularHourlyWage: 4250,
        assessment: {
          isOutlier: true,
          direction: 'BELOW',
          predictedSalary: expect.any(Number),
        },
        scoreBucketRangeFrom: 100,
        scoreBucketRangeTo: 200,
      })
      expect(outliers[0].predictedHourlyWage).toBeCloseTo(4383.93, 2)
      expect(outliers[0].assessment.differencePercent).toBeCloseTo(-3.055, 3)
    })

    // The point of the whole switch: half the monthly pay for half the hours is
    // the SAME hourly rate, so neither employee is an outlier relative to the
    // other. Under the old FTE divisor this pair was also equal — but only
    // because starfshlutfall happened to track hours, which is exactly the
    // assumption that failed for overtime.
    it('gives equal hourly wages for proportionally fewer hours', () => {
      const analysis = computeSalaryOutlierAnalysis({
        thresholdPercent: 3.9,
        employees: [
          baseEmployee({
            ordinal: 1,
            score: 250,
            paidHours: 200,
            baseSalary: 1000000,
          }),
          baseEmployee({
            ordinal: 2,
            score: 250,
            paidHours: 100,
            baseSalary: 500000,
          }),
        ],
      })

      expect(
        analysis.employees.map((employee) => employee.regularHourlyWage),
      ).toEqual([5000, 5000])
      expect(
        analysis.employees.map((employee) => employee.scoreBucketRangeFrom),
      ).toEqual([200, 200])
      expect(analysis.employees.map((employee) => employee.isOutlier)).toEqual([
        false,
        false,
      ])
    })

    it('returns an empty array when no employees deviate beyond the band', () => {
      const outliers = detectOutliers({
        thresholdPercent: 3.9,
        employees: [
          baseEmployee({ ordinal: 1, score: 100, baseSalary: 1000000 }),
          baseEmployee({ ordinal: 2, score: 200, baseSalary: 1100000 }),
          baseEmployee({ ordinal: 3, score: 300, baseSalary: 1200000 }),
        ],
      })

      expect(outliers).toEqual([])
    })

    it('returns an empty array on empty input', () => {
      expect(detectOutliers({ thresholdPercent: 3.9, employees: [] })).toEqual(
        [],
      )
    })

    it('uses the full threshold when useHalfThreshold is false', () => {
      // Ordinal 1 deviates by about 3% from the regression prediction.
      // Half-threshold (1.95%)
      // would flag it; full threshold (3.9%) wouldn't.
      const employees = regressionEmployees()

      expect(
        detectOutliers({ thresholdPercent: 3.9, employees }).map(
          (o) => o.ordinal,
        ),
      ).toEqual([1])

      expect(
        detectOutliers({
          thresholdPercent: 3.9,
          employees,
          useHalfThreshold: false,
        }),
      ).toEqual([])
    })
  })
})

function makeOutlierEmployee(
  overrides: Partial<OutlierDetectionEmployee>,
): OutlierDetectionEmployee {
  return {
    ordinal: 0,
    score: 100,
    gender: GenderEnum.FEMALE,
    paidHours: FIXTURE_PAID_HOURS,
    baseSalary: 1000000,
    additionalSalary: 0,
    bonusSalary: null,
    ...overrides,
  }
}
