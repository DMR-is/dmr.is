import { GenderEnum } from '../models/report.model'
import {
  assessSalaryOutlierFromReference,
  assessSalaryOutlierInBucket,
  computeCompensationAggregates,
  computeSalaryAggregateSnapshot,
  detectOutliers,
  type OutlierDetectionEmployee,
  roundSalaryAggregateSnapshot,
  roundSalaryResultSnapshot,
} from './compensation-aggregates'

describe('compensation-aggregates', () => {
  it('computes aggregate metrics and directional wage gaps across genders', () => {
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
    expect(snapshot.female).toEqual({
      average: 200,
      median: 200,
      minimum: 150,
      maximum: 250,
    })
    expect(snapshot.neutral).toEqual({
      average: 50,
      median: 50,
      minimum: 50,
      maximum: 50,
    })

    expect(snapshot.salaryDifferences).toEqual({
      maleFemale: 0,
      maleNeutral: 75,
      femaleMale: 0,
      femaleNeutral: 75,
      neutralMale: -300,
      neutralFemale: -300,
    })
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

  it('computes report-level base/full snapshots with score buckets', () => {
    const aggregates = computeCompensationAggregates({
      employees: [
        {
          reportEmployeeRoleId: 'role-b',
          score: 120,
          gender: GenderEnum.MALE,
          workRatio: 1,
          baseSalary: 400000,
          additionalSalary: 100000,
          bonusSalary: 50000,
        },
        {
          reportEmployeeRoleId: 'role-a',
          score: 220,
          gender: GenderEnum.FEMALE,
          workRatio: 0.5,
          baseSalary: 300000,
          additionalSalary: 50000,
          bonusSalary: null,
        },
      ],
    })

    expect(aggregates.report.base.totals.overall.average).toBe(500000)
    expect(aggregates.report.full.totals.overall.average).toBe(625000)
    expect(aggregates.report.base.scoreBuckets).toEqual([
      expect.objectContaining({
        rangeFrom: 100,
        rangeTo: 200,
        counts: { overall: 1, male: 1, female: 0, neutral: 0 },
        totals: expect.objectContaining({
          overall: expect.objectContaining({ average: 400000 }),
        }),
      }),
      expect.objectContaining({
        rangeFrom: 200,
        rangeTo: 300,
        counts: { overall: 1, male: 0, female: 1, neutral: 0 },
        totals: expect.objectContaining({
          overall: expect.objectContaining({ average: 600000 }),
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

  it('marks salaries outside half the threshold from a reference as outliers', () => {
    expect(
      assessSalaryOutlierFromReference({
        salary: 102000,
        referenceSalary: 100000,
        thresholdPercent: 3.9,
      }),
    ).toMatchObject({
      isOutlier: true,
      direction: 'ABOVE',
      allowedDifferencePercent: 1.95,
      referenceSalary: 100000,
    })

    expect(
      assessSalaryOutlierFromReference({
        salary: 98100,
        referenceSalary: 100000,
        thresholdPercent: 3.9,
      }),
    ).toMatchObject({
      isOutlier: false,
      direction: 'BELOW',
      allowedDifferencePercent: 1.95,
    })
  })

  it('assesses salary outlier against a score bucket median', () => {
    const aggregates = computeCompensationAggregates({
      employees: [
        {
          reportEmployeeRoleId: 'role-a',
          score: 120,
          gender: GenderEnum.MALE,
          workRatio: 1,
          baseSalary: 100000,
          additionalSalary: 0,
          bonusSalary: null,
        },
        {
          reportEmployeeRoleId: 'role-b',
          score: 120,
          gender: GenderEnum.FEMALE,
          workRatio: 1,
          baseSalary: 104000,
          additionalSalary: 0,
          bonusSalary: null,
        },
        {
          reportEmployeeRoleId: 'role-c',
          score: 120,
          gender: GenderEnum.MALE,
          workRatio: 1,
          baseSalary: 500000,
          additionalSalary: 0,
          bonusSalary: null,
        },
      ],
    })

    const bucket = aggregates.report.base.scoreBuckets[0]

    expect(
      assessSalaryOutlierInBucket({
        salary: 104000,
        bucket,
        thresholdPercent: 3.9,
      }),
    ).toMatchObject({
      isOutlier: false,
      direction: 'EQUAL',
      referenceSalary: 104000,
    })
  })

  describe('detectOutliers', () => {
    const baseEmployee = (
      overrides: Partial<OutlierDetectionEmployee>,
    ): OutlierDetectionEmployee => ({
      ordinal: 0,
      score: 100,
      gender: GenderEnum.FEMALE,
      workRatio: 1,
      baseSalary: 1000000,
      ...overrides,
    })

    it('returns the employees whose adjusted base salary deviates beyond the half-threshold band around the bucket median', () => {
      // 3 employees in the same score bucket. Median = 1,200,000.
      // Ordinal 1 is 16.7% below the median (deviates) — flagged.
      // Ordinals 2 and 3 land within 0.84% of the median — not flagged.
      const outliers = detectOutliers({
        thresholdPercent: 3.9,
        employees: [
          baseEmployee({ ordinal: 1, score: 250, baseSalary: 1000000 }),
          baseEmployee({ ordinal: 2, score: 250, baseSalary: 1200000 }),
          baseEmployee({ ordinal: 3, score: 250, baseSalary: 1210000 }),
        ],
      })

      expect(outliers).toHaveLength(1)
      expect(outliers[0]).toMatchObject({
        ordinal: 1,
        adjustedBaseSalary: 1000000,
        assessment: {
          isOutlier: true,
          direction: 'BELOW',
          referenceSalary: 1200000,
        },
      })
    })

    it('honours workRatio when adjusting base salary for detection', () => {
      // Same baseSalary but ordinal 1 is part-time (workRatio 0.5), so
      // adjusted base salary is 2x ordinal 2's. With 2 samples, the median
      // is the midpoint and both deviate by 33% — both are flagged.
      const outliers = detectOutliers({
        thresholdPercent: 3.9,
        employees: [
          baseEmployee({
            ordinal: 1,
            score: 250,
            workRatio: 0.5,
            baseSalary: 800000,
          }),
          baseEmployee({
            ordinal: 2,
            score: 250,
            workRatio: 1,
            baseSalary: 800000,
          }),
        ],
      })

      expect(outliers.map((o) => o.ordinal).sort()).toEqual([1, 2])
      const ordinal1 = outliers.find((o) => o.ordinal === 1)!
      expect(ordinal1.adjustedBaseSalary).toBe(1600000)
    })

    it('reports the score-bucket each outlier landed in', () => {
      const outliers = detectOutliers({
        thresholdPercent: 3.9,
        employees: [
          baseEmployee({ ordinal: 1, score: 250, baseSalary: 1000000 }),
          baseEmployee({ ordinal: 2, score: 250, baseSalary: 1200000 }),
          baseEmployee({ ordinal: 3, score: 250, baseSalary: 1210000 }),
        ],
      })

      // Default bucket width is 100. Score 250 → bucket [200, 300).
      expect(outliers[0].bucket.rangeFrom).toBe(200)
      expect(outliers[0].bucket.rangeTo).toBe(300)
    })

    it('returns an empty array when no employees deviate beyond the band', () => {
      const outliers = detectOutliers({
        thresholdPercent: 3.9,
        employees: [
          baseEmployee({ ordinal: 1, score: 250, baseSalary: 1000000 }),
          baseEmployee({ ordinal: 2, score: 250, baseSalary: 1010000 }),
          baseEmployee({ ordinal: 3, score: 250, baseSalary: 1005000 }),
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
      // Ordinal 1 deviates by 3% from the median. Half-threshold (1.95%)
      // would flag it; full threshold (3.9%) wouldn't.
      const employees = [
        baseEmployee({ ordinal: 1, score: 250, baseSalary: 970000 }),
        baseEmployee({ ordinal: 2, score: 250, baseSalary: 1000000 }),
        baseEmployee({ ordinal: 3, score: 250, baseSalary: 1003000 }),
      ]

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
