import { NotFoundException } from '@nestjs/common'
import { getModelToken } from '@nestjs/sequelize'
import { Test } from '@nestjs/testing'

import { LOGGER_PROVIDER } from '@dmr.is/logging'

import { GenderEnum } from '../report/models/report.model'
import { ReportCriterionModel } from '../report-criterion/models/report-criterion.model'
import { ReportSubCriterionModel } from '../report-criterion/models/report-sub-criterion.model'
import { ReportSubCriterionStepModel } from '../report-criterion/models/report-sub-criterion-step.model'
import { ReportEmployeeModel } from '../report-employee/models/report-employee.model'
import { ReportEmployeePersonalCriterionStepModel } from '../report-employee/models/report-employee-personal-criterion-step.model'
import { ReportEmployeeRoleCriterionStepModel } from '../report-employee/models/report-employee-role-criterion-step.model'
import { ReportStatisticsService } from './report-statistics.service'

const REPORT_ID = '00000000-0000-0000-0000-000000000001'

const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

/**
 * `paidHours` is **greiddar stundir**, so every expected figure below is a rate:
 * `makeEmployee(300, 400000, 200, …)` is 400.000 kr. over 200 klst. = **2.000
 * kr./klst.** 200 matches `FIXTURE_PAID_HOURS` in the other API specs — a full
 * month with some overtime — and 160 / 100 appear where a test needs a
 * part-time contrast.
 *
 * ⚠️ These were `1`, `0.8` and `0.5` until 2026-08-20 — leftovers from when the
 * argument was `workRatio`, where `1` meant "100% starf". Under an hours
 * denominator that made `makeEmployee(300, 400000, 1, …)` assert a **400.000
 * kr./klst.** wage. Every assertion still passed, because what these tests check
 * are ratios (gaps, averages, medians, bucket placement) and ratios are
 * invariant to the scale factor — so it was never a bug, but it read as one, and
 * a spec that describes something impossible is worse than no spec. Rescaling
 * was a clean ×200 on hours and ÷200 on every rate; the raw benefits amounts
 * further down are NOT rates and were left alone.
 */
const makeEmployee = (
  score: number,
  baseSalary: number,
  paidHours: number,
  gender: GenderEnum,
  overrides?: {
    id?: string
    reportEmployeeRoleId?: string
    additionalSalary?: number
    bonusSalary?: number | null
  },
) =>
  ({
    score,
    baseSalary,
    paidHours,
    gender,
    additionalSalary: overrides?.additionalSalary ?? 0,
    bonusSalary: overrides?.bonusSalary ?? null,
    id: overrides?.id ?? 'emp-default',
    reportEmployeeRoleId: overrides?.reportEmployeeRoleId ?? 'role-default',
  }) as unknown as ReportEmployeeModel

// ── Helpers for "Work" tests ────────────────────────────────────────

const STEP_WORK_A = 'step-work-a'
const STEP_WORK_B = 'step-work-b'
const STEP_PERSONAL = 'step-personal'

const CRITERION_WORK = 'crit-work'
const SUB_CRIT_WORK = 'sub-crit-work'

const makeCriterion = (id: string, type: string) =>
  ({ id, type }) as unknown as ReportCriterionModel

const makeSubCriterion = (id: string, reportCriterionId: string) =>
  ({ id, reportCriterionId }) as unknown as ReportSubCriterionModel

const makeStep = (id: string, reportSubCriterionId: string, score: number) =>
  ({
    id,
    reportSubCriterionId,
    score,
  }) as unknown as ReportSubCriterionStepModel

const makeRoleStepLink = (roleId: string, stepId: string) =>
  ({
    reportEmployeeRoleId: roleId,
    reportSubCriterionStepId: stepId,
  }) as unknown as ReportEmployeeRoleCriterionStepModel

const makePersonalStepLink = (employeeId: string, stepId: string) =>
  ({
    reportEmployeeId: employeeId,
    reportSubCriterionStepId: stepId,
  }) as unknown as ReportEmployeePersonalCriterionStepModel

describe('ReportStatisticsService', () => {
  let service: ReportStatisticsService
  let employeeFindAll: jest.Mock
  let criterionFindAll: jest.Mock
  let subCriterionFindAll: jest.Mock
  let stepFindAll: jest.Mock
  let roleStepFindAll: jest.Mock
  let personalStepFindAll: jest.Mock

  beforeEach(async () => {
    employeeFindAll = jest.fn()
    criterionFindAll = jest.fn().mockResolvedValue([])
    subCriterionFindAll = jest.fn().mockResolvedValue([])
    stepFindAll = jest.fn().mockResolvedValue([])
    roleStepFindAll = jest.fn().mockResolvedValue([])
    personalStepFindAll = jest.fn().mockResolvedValue([])

    const module = await Test.createTestingModule({
      providers: [
        ReportStatisticsService,
        { provide: LOGGER_PROVIDER, useValue: mockLogger },
        {
          provide: getModelToken(ReportEmployeeModel),
          useValue: { findAll: employeeFindAll },
        },
        {
          provide: getModelToken(ReportCriterionModel),
          useValue: { findAll: criterionFindAll },
        },
        {
          provide: getModelToken(ReportSubCriterionModel),
          useValue: { findAll: subCriterionFindAll },
        },
        {
          provide: getModelToken(ReportSubCriterionStepModel),
          useValue: { findAll: stepFindAll },
        },
        {
          provide: getModelToken(ReportEmployeeRoleCriterionStepModel),
          useValue: { findAll: roleStepFindAll },
        },
        {
          provide: getModelToken(ReportEmployeePersonalCriterionStepModel),
          useValue: { findAll: personalStepFindAll },
        },
      ],
    }).compile()

    service = module.get(ReportStatisticsService)
  })

  // ── getRegularHourlyWageByScoreAll ──────────────────────────────

  describe('getRegularHourlyWageByScoreAll', () => {
    it('throws NotFoundException when no employees exist', async () => {
      employeeFindAll.mockResolvedValue([])

      await expect(
        service.getRegularHourlyWageByScoreAll(REPORT_ID),
      ).rejects.toThrow(NotFoundException)
    })

    it('computes reglulegt tímakaup as regluleg laun / greiddar stundir', async () => {
      // 1.000.000 kr. over 160 klst. (a part-time month) = 6.250 kr./klst.
      employeeFindAll.mockResolvedValue([
        makeEmployee(300, 1000000, 160, GenderEnum.MALE),
      ])

      const result = await service.getRegularHourlyWageByScoreAll(REPORT_ID)

      expect(result.dataPoints).toHaveLength(1)
      expect(result.dataPoints[0].regularHourlyWage).toBe(6250)
    })

    it('assigns employees to correct 100-point score buckets', async () => {
      employeeFindAll.mockResolvedValue([
        makeEmployee(150, 400000, 200, GenderEnum.MALE),
        makeEmployee(250, 500000, 200, GenderEnum.FEMALE),
        makeEmployee(310, 600000, 200, GenderEnum.MALE),
      ])

      const result = await service.getRegularHourlyWageByScoreAll(REPORT_ID)

      expect(result.scoreBuckets).toHaveLength(3)
      expect(result.scoreBuckets[0]).toMatchObject({
        rangeFrom: 100,
        rangeTo: 200,
      })
      expect(result.scoreBuckets[1]).toMatchObject({
        rangeFrom: 200,
        rangeTo: 300,
      })
      expect(result.scoreBuckets[2]).toMatchObject({
        rangeFrom: 300,
        rangeTo: 400,
      })
    })

    it('skips empty buckets', async () => {
      employeeFindAll.mockResolvedValue([
        makeEmployee(150, 400000, 200, GenderEnum.MALE),
        makeEmployee(450, 600000, 200, GenderEnum.FEMALE),
      ])

      const result = await service.getRegularHourlyWageByScoreAll(REPORT_ID)

      expect(result.scoreBuckets).toHaveLength(2)
      expect(result.scoreBuckets[0].rangeFrom).toBe(100)
      expect(result.scoreBuckets[1].rangeFrom).toBe(400)
    })

    it('computes per-bucket averages and medians by gender', async () => {
      employeeFindAll.mockResolvedValue([
        makeEmployee(350, 300000, 200, GenderEnum.MALE),
        makeEmployee(370, 400000, 200, GenderEnum.MALE),
        makeEmployee(360, 200000, 200, GenderEnum.FEMALE),
      ])

      const result = await service.getRegularHourlyWageByScoreAll(REPORT_ID)
      const bucket = result.scoreBuckets[0]

      // Averages
      expect(bucket.maleAverageSalary).toBe(1750)
      expect(bucket.femaleAverageSalary).toBe(1000)
      expect(bucket.overallAverageSalary).toBe(1500)

      // Medians — male sorted [300k, 400k] → (300k+400k)/2 = 350k
      expect(bucket.maleMedianSalary).toBe(1750)
      expect(bucket.femaleMedianSalary).toBe(1000)
      expect(bucket.overallMedianSalary).toBe(1500)

      expect(bucket.maleCount).toBe(2)
      expect(bucket.femaleCount).toBe(1)
    })

    it('computes median correctly for odd-count groups', async () => {
      // 3 males: sorted salaries [200k, 400k, 600k] → median = 400k (middle)
      employeeFindAll.mockResolvedValue([
        makeEmployee(350, 600000, 200, GenderEnum.MALE),
        makeEmployee(360, 200000, 200, GenderEnum.MALE),
        makeEmployee(370, 400000, 200, GenderEnum.MALE),
      ])

      const result = await service.getRegularHourlyWageByScoreAll(REPORT_ID)

      expect(result.scoreBuckets[0].maleMedianSalary).toBe(2000)
      expect(result.totals.maleMedianSalary).toBe(2000)
    })

    it('computes wage gap as ((male - female) / male) * 100', async () => {
      // male avg = 350000, female avg = 200000
      // gap = (350000 - 200000) / 350000 * 100 = 42.9%
      employeeFindAll.mockResolvedValue([
        makeEmployee(350, 350000, 200, GenderEnum.MALE),
        makeEmployee(360, 200000, 200, GenderEnum.FEMALE),
      ])

      const result = await service.getRegularHourlyWageByScoreAll(REPORT_ID)

      expect(result.scoreBuckets[0].wageGapPercent).toBe(42.9)
    })

    it('returns negative wage gap when females earn more', async () => {
      employeeFindAll.mockResolvedValue([
        makeEmployee(350, 600000, 200, GenderEnum.MALE),
        makeEmployee(360, 700000, 200, GenderEnum.FEMALE),
      ])

      const result = await service.getRegularHourlyWageByScoreAll(REPORT_ID)

      expect(result.scoreBuckets[0].wageGapPercent).toBeLessThan(0)
    })

    it('returns null wage gap when one gender is missing from bucket', async () => {
      employeeFindAll.mockResolvedValue([
        makeEmployee(350, 600000, 200, GenderEnum.MALE),
      ])

      const result = await service.getRegularHourlyWageByScoreAll(REPORT_ID)

      expect(result.scoreBuckets[0].wageGapPercent).toBeNull()
      expect(result.scoreBuckets[0].femaleAverageSalary).toBeNull()
    })

    it('computes overall totals across all employees', async () => {
      employeeFindAll.mockResolvedValue([
        makeEmployee(300, 400000, 200, GenderEnum.MALE),
        makeEmployee(500, 600000, 200, GenderEnum.MALE),
        makeEmployee(300, 500000, 200, GenderEnum.FEMALE),
      ])

      const result = await service.getRegularHourlyWageByScoreAll(REPORT_ID)

      expect(result.totals.maleAverageSalary).toBe(2500)
      expect(result.totals.femaleAverageSalary).toBe(2500)
      expect(result.totals.overallAverageSalary).toBe(2500)
      expect(result.totals.wageGapPercent).toBe(0)
      expect(result.totals.maleCount).toBe(2)
      expect(result.totals.femaleCount).toBe(1)
    })

    it('computes linear regression with known values', async () => {
      // Points: (100, 100000), (200, 200000), (300, 300000)
      // Perfect line: y = 1000x + 0
      employeeFindAll.mockResolvedValue([
        makeEmployee(100, 100000, 200, GenderEnum.MALE),
        makeEmployee(200, 200000, 200, GenderEnum.FEMALE),
        makeEmployee(300, 300000, 200, GenderEnum.MALE),
      ])

      const result = await service.getRegularHourlyWageByScoreAll(REPORT_ID)

      expect(result.regressionLine.slope).toBe(5)
      expect(result.regressionLine.intercept).toBe(0)
    })

    it('handles single employee (regression with n=1)', async () => {
      employeeFindAll.mockResolvedValue([
        makeEmployee(300, 500000, 200, GenderEnum.MALE),
      ])

      const result = await service.getRegularHourlyWageByScoreAll(REPORT_ID)

      expect(result.regressionLine.slope).toBe(0)
      expect(result.regressionLine.intercept).toBe(2500)
      expect(result.dataPoints).toHaveLength(1)
    })

    it('places employee with score exactly on boundary in the correct bucket', async () => {
      // Score 300 should be in bucket 300-400, not 200-300
      employeeFindAll.mockResolvedValue([
        makeEmployee(300, 500000, 200, GenderEnum.MALE),
      ])

      const result = await service.getRegularHourlyWageByScoreAll(REPORT_ID)

      expect(result.scoreBuckets).toHaveLength(1)
      expect(result.scoreBuckets[0].rangeFrom).toBe(300)
      expect(result.scoreBuckets[0].rangeTo).toBe(400)
    })
  })

  // ── getRegularHourlyWageByScoreWork ─────────────────────────────

  describe('getRegularHourlyWageByScoreWork', () => {
    /**
     * Wires up the criterion chain mocks so that:
     * - CRITERION_WORK (RESPONSIBILITY) → SUB_CRIT_WORK → STEP_WORK_A (score 200), STEP_WORK_B (score 300)
     * - CRITERION_PERSONAL (PERSONAL)   → SUB_CRIT_PERSONAL → STEP_PERSONAL (score 150)
     *
     * criterionFindAll is filtered by type != PERSONAL in the service,
     * so it should only return work criteria.
     */
    const setupCriterionChain = () => {
      criterionFindAll.mockResolvedValue([
        makeCriterion(CRITERION_WORK, 'RESPONSIBILITY'),
      ])
      subCriterionFindAll.mockResolvedValue([
        makeSubCriterion(SUB_CRIT_WORK, CRITERION_WORK),
      ])
      stepFindAll.mockResolvedValue([
        makeStep(STEP_WORK_A, SUB_CRIT_WORK, 200),
        makeStep(STEP_WORK_B, SUB_CRIT_WORK, 300),
      ])
    }

    it('computes work score from non-PERSONAL role steps only', async () => {
      setupCriterionChain()

      employeeFindAll.mockResolvedValue([
        makeEmployee(999, 600000, 200, GenderEnum.MALE, {
          id: 'emp-1',
          reportEmployeeRoleId: 'role-1',
        }),
      ])

      // Role has both work steps (200 + 300 = 500)
      roleStepFindAll.mockResolvedValue([
        makeRoleStepLink('role-1', STEP_WORK_A),
        makeRoleStepLink('role-1', STEP_WORK_B),
      ])
      personalStepFindAll.mockResolvedValue([])

      const result = await service.getRegularHourlyWageByScoreWork(REPORT_ID)

      expect(result.dataPoints).toHaveLength(1)
      expect(result.dataPoints[0].score).toBe(500) // 200 + 300
      expect(result.dataPoints[0].regularHourlyWage).toBe(3000)
    })

    it('excludes PERSONAL-criterion steps from work score', async () => {
      setupCriterionChain()

      employeeFindAll.mockResolvedValue([
        makeEmployee(999, 600000, 200, GenderEnum.MALE, {
          id: 'emp-1',
          reportEmployeeRoleId: 'role-1',
        }),
      ])

      // Role has one work step (200) plus one PERSONAL step (not in workSteps)
      roleStepFindAll.mockResolvedValue([
        makeRoleStepLink('role-1', STEP_WORK_A),
        makeRoleStepLink('role-1', STEP_PERSONAL), // filtered out
      ])
      personalStepFindAll.mockResolvedValue([])

      const result = await service.getRegularHourlyWageByScoreWork(REPORT_ID)

      // Only STEP_WORK_A counts (score 200), STEP_PERSONAL is excluded
      expect(result.dataPoints[0].score).toBe(200)
    })

    it('includes personal-assigned steps that belong to work criteria', async () => {
      setupCriterionChain()

      employeeFindAll.mockResolvedValue([
        makeEmployee(999, 600000, 200, GenderEnum.FEMALE, {
          id: 'emp-1',
          reportEmployeeRoleId: 'role-1',
        }),
      ])

      // Role has step A (200), personal has step B (300)
      roleStepFindAll.mockResolvedValue([
        makeRoleStepLink('role-1', STEP_WORK_A),
      ])
      personalStepFindAll.mockResolvedValue([
        makePersonalStepLink('emp-1', STEP_WORK_B),
      ])

      const result = await service.getRegularHourlyWageByScoreWork(REPORT_ID)

      // 200 (role) + 300 (personal, but work-type) = 500
      expect(result.dataPoints[0].score).toBe(500)
    })

    it('deduplicates steps assigned via both role and personal', async () => {
      setupCriterionChain()

      employeeFindAll.mockResolvedValue([
        makeEmployee(999, 600000, 200, GenderEnum.MALE, {
          id: 'emp-1',
          reportEmployeeRoleId: 'role-1',
        }),
      ])

      // Same step assigned via both role AND personal — should count once
      roleStepFindAll.mockResolvedValue([
        makeRoleStepLink('role-1', STEP_WORK_A),
      ])
      personalStepFindAll.mockResolvedValue([
        makePersonalStepLink('emp-1', STEP_WORK_A),
      ])

      const result = await service.getRegularHourlyWageByScoreWork(REPORT_ID)

      // Step A (200) counted once, not twice
      expect(result.dataPoints[0].score).toBe(200)
    })

    it('returns zero work score when employee has no applicable work steps', async () => {
      setupCriterionChain()

      employeeFindAll.mockResolvedValue([
        makeEmployee(999, 600000, 200, GenderEnum.MALE, {
          id: 'emp-1',
          reportEmployeeRoleId: 'role-1',
        }),
      ])

      roleStepFindAll.mockResolvedValue([])
      personalStepFindAll.mockResolvedValue([])

      const result = await service.getRegularHourlyWageByScoreWork(REPORT_ID)

      expect(result.dataPoints[0].score).toBe(0)
    })
  })

  describe('getRegularHourlyWageGenderWageGap', () => {
    it('returns average and median base salary per gender with wage gap', async () => {
      employeeFindAll.mockResolvedValue([
        makeEmployee(0, 700000, 200, GenderEnum.MALE),
        makeEmployee(0, 800000, 200, GenderEnum.FEMALE),
      ])

      const result = await service.getRegularHourlyWageGenderWageGap(REPORT_ID)

      expect(result.maleAverageSalary).toBe(3500)
      expect(result.femaleAverageSalary).toBe(4000)
      expect(result.overallAverageSalary).toBe(3750)
      expect(result.maleMedianSalary).toBe(3500)
      expect(result.femaleMedianSalary).toBe(4000)
      expect(result.maleCount).toBe(1)
      expect(result.femaleCount).toBe(1)
    })

    it('computes negative wage gap when females earn more', async () => {
      // male avg 705,160, female avg 804,248
      // gap = (705160 - 804248) / 705160 * 100 = -14.05 → -14.0
      employeeFindAll.mockResolvedValue([
        makeEmployee(0, 705160, 200, GenderEnum.MALE),
        makeEmployee(0, 804248, 200, GenderEnum.FEMALE),
      ])

      const result = await service.getRegularHourlyWageGenderWageGap(REPORT_ID)

      expect(result.averageWageGapPercent).toBeLessThan(0)
    })

    it('divides by greiddar stundir, so fewer hours means a higher rate', async () => {
      // The man earns LESS per month but MORE per hour: 500.000 / 160 = 3.125
      // vs 600.000 / 200 = 3.000. This is the whole point of the switch — the
      // FTE divisor could only approximate it, and got it wrong for overtime.
      employeeFindAll.mockResolvedValue([
        makeEmployee(0, 500000, 160, GenderEnum.MALE),
        makeEmployee(0, 600000, 200, GenderEnum.FEMALE),
      ])

      const result = await service.getRegularHourlyWageGenderWageGap(REPORT_ID)

      expect(result.maleAverageSalary).toBe(3125)
      expect(result.femaleAverageSalary).toBe(3000)
    })
  })

  describe('getBenefitsBreakdown', () => {
    it('returns average bonus and additional per gender (raw monthly, not divided by hours)', async () => {
      // Male: bonus 20k, additional 40k
      // Female: bonus 70k, additional 30k
      employeeFindAll.mockResolvedValue([
        makeEmployee(0, 500000, 160, GenderEnum.MALE, {
          additionalSalary: 40000,
          bonusSalary: 20000,
        }),
        makeEmployee(0, 600000, 100, GenderEnum.FEMALE, {
          additionalSalary: 30000,
          bonusSalary: 70000,
        }),
      ])

      const result = await service.getBenefitsBreakdown(REPORT_ID)

      // Raw monthly amounts — greiddar stundir must NOT divide these. They are
      // kr., not kr./klst., which is why they did not move in the ×200 rescale.
      expect(result.male.averageBonusSalary).toBe(20000)
      expect(result.male.averageAdditionalSalary).toBe(40000)
      expect(result.male.averageTotal).toBe(60000)
      expect(result.female.averageBonusSalary).toBe(70000)
      expect(result.female.averageAdditionalSalary).toBe(30000)
      expect(result.female.averageTotal).toBe(100000)
    })

    it('computes overall averages across both genders', async () => {
      employeeFindAll.mockResolvedValue([
        makeEmployee(0, 0, 200, GenderEnum.MALE, {
          additionalSalary: 40000,
          bonusSalary: 20000,
        }),
        makeEmployee(0, 0, 200, GenderEnum.FEMALE, {
          additionalSalary: 30000,
          bonusSalary: 70000,
        }),
      ])

      const result = await service.getBenefitsBreakdown(REPORT_ID)

      // overall bonus avg = (20k + 70k) / 2 = 45k
      expect(result.overall.averageBonusSalary).toBe(45000)
      // overall additional avg = (40k + 30k) / 2 = 35k
      expect(result.overall.averageAdditionalSalary).toBe(35000)
      expect(result.overall.averageTotal).toBe(80000)
    })

    it('computes wage gap per component and total', async () => {
      // Male: bonus 100, additional 200, total 300
      // Female: bonus 200, additional 100, total 300
      employeeFindAll.mockResolvedValue([
        makeEmployee(0, 0, 200, GenderEnum.MALE, {
          additionalSalary: 200,
          bonusSalary: 100,
        }),
        makeEmployee(0, 0, 200, GenderEnum.FEMALE, {
          additionalSalary: 100,
          bonusSalary: 200,
        }),
      ])

      const result = await service.getBenefitsBreakdown(REPORT_ID)

      // bonus gap = (100 - 200) / 100 * 100 = -100%
      expect(result.bonusWageGapPercent).toBe(-100)
      // additional gap = (200 - 100) / 200 * 100 = 50%
      expect(result.additionalWageGapPercent).toBe(50)
      // total gap = (300 - 300) / 300 * 100 = 0%
      expect(result.totalWageGapPercent).toBe(0)
    })

    it('treats null bonusSalary as zero', async () => {
      employeeFindAll.mockResolvedValue([
        makeEmployee(0, 0, 200, GenderEnum.MALE, {
          additionalSalary: 50000,
          bonusSalary: null,
        }),
      ])

      const result = await service.getBenefitsBreakdown(REPORT_ID)

      expect(result.male.averageBonusSalary).toBe(0)
      expect(result.male.averageTotal).toBe(50000)
    })

    it('includes count per gender', async () => {
      employeeFindAll.mockResolvedValue([
        makeEmployee(0, 0, 200, GenderEnum.MALE, { additionalSalary: 100 }),
        makeEmployee(0, 0, 200, GenderEnum.MALE, { additionalSalary: 200 }),
        makeEmployee(0, 0, 200, GenderEnum.FEMALE, { additionalSalary: 300 }),
      ])

      const result = await service.getBenefitsBreakdown(REPORT_ID)

      expect(result.male.count).toBe(2)
      expect(result.female.count).toBe(1)
      expect(result.overall.count).toBe(3)
    })
  })
})
