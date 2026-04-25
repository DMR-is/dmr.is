import { GenderEnum } from '../models/report.model'
import {
  computeCompensationAggregates,
  computeSalaryAggregateSnapshot,
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
      overall: { average: 1.234, median: 2.345, minimum: 0.555, maximum: 9.999 },
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
})
