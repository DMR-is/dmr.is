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

const makeEmployee = (
  score: number,
  baseSalary: number,
  workRatio: number,
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
    workRatio,
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
  ({ id, reportSubCriterionId, score }) as unknown as ReportSubCriterionStepModel

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

  // ── getBaseSalaryByGenderAndScoreAll ──────────────────────────────

  describe('getBaseSalaryByGenderAndScoreAll', () => {
    it('throws NotFoundException when no employees exist', async () => {
      employeeFindAll.mockResolvedValue([])

      await expect(
        service.getBaseSalaryByGenderAndScoreAll(REPORT_ID),
      ).rejects.toThrow(NotFoundException)
    })

    it('computes adjusted base salary as baseSalary / workRatio', async () => {
      // 1,000,000 kr base salary at 80% work ratio → 1,250,000 kr full-time equivalent
      employeeFindAll.mockResolvedValue([
        makeEmployee(300, 1000000, 0.8, GenderEnum.MALE),
      ])

      const result = await service.getBaseSalaryByGenderAndScoreAll(REPORT_ID)

      expect(result.dataPoints).toHaveLength(1)
      expect(result.dataPoints[0].adjustedSalary).toBe(1250000)
    })

    it('assigns employees to correct 100-point score buckets', async () => {
      employeeFindAll.mockResolvedValue([
        makeEmployee(150, 400000, 1, GenderEnum.MALE),
        makeEmployee(250, 500000, 1, GenderEnum.FEMALE),
        makeEmployee(310, 600000, 1, GenderEnum.MALE),
      ])

      const result = await service.getBaseSalaryByGenderAndScoreAll(REPORT_ID)

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
        makeEmployee(150, 400000, 1, GenderEnum.MALE),
        makeEmployee(450, 600000, 1, GenderEnum.FEMALE),
      ])

      const result = await service.getBaseSalaryByGenderAndScoreAll(REPORT_ID)

      expect(result.scoreBuckets).toHaveLength(2)
      expect(result.scoreBuckets[0].rangeFrom).toBe(100)
      expect(result.scoreBuckets[1].rangeFrom).toBe(400)
    })

    it('computes per-bucket averages and medians by gender', async () => {
      employeeFindAll.mockResolvedValue([
        makeEmployee(350, 300000, 1, GenderEnum.MALE),
        makeEmployee(370, 400000, 1, GenderEnum.MALE),
        makeEmployee(360, 200000, 1, GenderEnum.FEMALE),
      ])

      const result = await service.getBaseSalaryByGenderAndScoreAll(REPORT_ID)
      const bucket = result.scoreBuckets[0]

      // Averages
      expect(bucket.maleAverageSalary).toBe(350000)
      expect(bucket.femaleAverageSalary).toBe(200000)
      expect(bucket.overallAverageSalary).toBe(300000)

      // Medians — male sorted [300k, 400k] → (300k+400k)/2 = 350k
      expect(bucket.maleMedianSalary).toBe(350000)
      expect(bucket.femaleMedianSalary).toBe(200000)
      expect(bucket.overallMedianSalary).toBe(300000)

      expect(bucket.maleCount).toBe(2)
      expect(bucket.femaleCount).toBe(1)
    })

    it('computes median correctly for odd-count groups', async () => {
      // 3 males: sorted salaries [200k, 400k, 600k] → median = 400k (middle)
      employeeFindAll.mockResolvedValue([
        makeEmployee(350, 600000, 1, GenderEnum.MALE),
        makeEmployee(360, 200000, 1, GenderEnum.MALE),
        makeEmployee(370, 400000, 1, GenderEnum.MALE),
      ])

      const result = await service.getBaseSalaryByGenderAndScoreAll(REPORT_ID)

      expect(result.scoreBuckets[0].maleMedianSalary).toBe(400000)
      expect(result.totals.maleMedianSalary).toBe(400000)
    })

    it('computes wage gap as ((male - female) / male) * 100', async () => {
      // male avg = 350000, female avg = 200000
      // gap = (350000 - 200000) / 350000 * 100 = 42.9%
      employeeFindAll.mockResolvedValue([
        makeEmployee(350, 350000, 1, GenderEnum.MALE),
        makeEmployee(360, 200000, 1, GenderEnum.FEMALE),
      ])

      const result = await service.getBaseSalaryByGenderAndScoreAll(REPORT_ID)

      expect(result.scoreBuckets[0].wageGapPercent).toBe(42.9)
    })

    it('returns negative wage gap when females earn more', async () => {
      employeeFindAll.mockResolvedValue([
        makeEmployee(350, 600000, 1, GenderEnum.MALE),
        makeEmployee(360, 700000, 1, GenderEnum.FEMALE),
      ])

      const result = await service.getBaseSalaryByGenderAndScoreAll(REPORT_ID)

      expect(result.scoreBuckets[0].wageGapPercent).toBeLessThan(0)
    })

    it('returns null wage gap when one gender is missing from bucket', async () => {
      employeeFindAll.mockResolvedValue([
        makeEmployee(350, 600000, 1, GenderEnum.MALE),
      ])

      const result = await service.getBaseSalaryByGenderAndScoreAll(REPORT_ID)

      expect(result.scoreBuckets[0].wageGapPercent).toBeNull()
      expect(result.scoreBuckets[0].femaleAverageSalary).toBeNull()
    })

    it('computes overall totals across all employees', async () => {
      employeeFindAll.mockResolvedValue([
        makeEmployee(300, 400000, 1, GenderEnum.MALE),
        makeEmployee(500, 600000, 1, GenderEnum.MALE),
        makeEmployee(300, 500000, 1, GenderEnum.FEMALE),
      ])

      const result = await service.getBaseSalaryByGenderAndScoreAll(REPORT_ID)

      expect(result.totals.maleAverageSalary).toBe(500000)
      expect(result.totals.femaleAverageSalary).toBe(500000)
      expect(result.totals.overallAverageSalary).toBe(500000)
      expect(result.totals.wageGapPercent).toBe(0)
      expect(result.totals.maleCount).toBe(2)
      expect(result.totals.femaleCount).toBe(1)
    })

    it('computes linear regression with known values', async () => {
      // Points: (100, 100000), (200, 200000), (300, 300000)
      // Perfect line: y = 1000x + 0
      employeeFindAll.mockResolvedValue([
        makeEmployee(100, 100000, 1, GenderEnum.MALE),
        makeEmployee(200, 200000, 1, GenderEnum.FEMALE),
        makeEmployee(300, 300000, 1, GenderEnum.MALE),
      ])

      const result = await service.getBaseSalaryByGenderAndScoreAll(REPORT_ID)

      expect(result.regressionLine.slope).toBe(1000)
      expect(result.regressionLine.intercept).toBe(0)
    })

    it('handles single employee (regression with n=1)', async () => {
      employeeFindAll.mockResolvedValue([
        makeEmployee(300, 500000, 1, GenderEnum.MALE),
      ])

      const result = await service.getBaseSalaryByGenderAndScoreAll(REPORT_ID)

      expect(result.regressionLine.slope).toBe(0)
      expect(result.regressionLine.intercept).toBe(500000)
      expect(result.dataPoints).toHaveLength(1)
    })

    it('places employee with score exactly on boundary in the correct bucket', async () => {
      // Score 300 should be in bucket 300-400, not 200-300
      employeeFindAll.mockResolvedValue([
        makeEmployee(300, 500000, 1, GenderEnum.MALE),
      ])

      const result = await service.getBaseSalaryByGenderAndScoreAll(REPORT_ID)

      expect(result.scoreBuckets).toHaveLength(1)
      expect(result.scoreBuckets[0].rangeFrom).toBe(300)
      expect(result.scoreBuckets[0].rangeTo).toBe(400)
    })
  })

  // ── getBaseSalaryByGenderAndScoreWork ─────────────────────────────

  describe('getBaseSalaryByGenderAndScoreWork', () => {
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
        makeEmployee(999, 600000, 1, GenderEnum.MALE, {
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

      const result =
        await service.getBaseSalaryByGenderAndScoreWork(REPORT_ID)

      expect(result.dataPoints).toHaveLength(1)
      expect(result.dataPoints[0].score).toBe(500) // 200 + 300
      expect(result.dataPoints[0].adjustedSalary).toBe(600000)
    })

    it('excludes PERSONAL-criterion steps from work score', async () => {
      setupCriterionChain()

      employeeFindAll.mockResolvedValue([
        makeEmployee(999, 600000, 1, GenderEnum.MALE, {
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

      const result =
        await service.getBaseSalaryByGenderAndScoreWork(REPORT_ID)

      // Only STEP_WORK_A counts (score 200), STEP_PERSONAL is excluded
      expect(result.dataPoints[0].score).toBe(200)
    })

    it('includes personal-assigned steps that belong to work criteria', async () => {
      setupCriterionChain()

      employeeFindAll.mockResolvedValue([
        makeEmployee(999, 600000, 1, GenderEnum.FEMALE, {
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

      const result =
        await service.getBaseSalaryByGenderAndScoreWork(REPORT_ID)

      // 200 (role) + 300 (personal, but work-type) = 500
      expect(result.dataPoints[0].score).toBe(500)
    })

    it('deduplicates steps assigned via both role and personal', async () => {
      setupCriterionChain()

      employeeFindAll.mockResolvedValue([
        makeEmployee(999, 600000, 1, GenderEnum.MALE, {
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

      const result =
        await service.getBaseSalaryByGenderAndScoreWork(REPORT_ID)

      // Step A (200) counted once, not twice
      expect(result.dataPoints[0].score).toBe(200)
    })

    it('returns zero work score when employee has no applicable work steps', async () => {
      setupCriterionChain()

      employeeFindAll.mockResolvedValue([
        makeEmployee(999, 600000, 1, GenderEnum.MALE, {
          id: 'emp-1',
          reportEmployeeRoleId: 'role-1',
        }),
      ])

      roleStepFindAll.mockResolvedValue([])
      personalStepFindAll.mockResolvedValue([])

      const result =
        await service.getBaseSalaryByGenderAndScoreWork(REPORT_ID)

      expect(result.dataPoints[0].score).toBe(0)
    })
  })

  // ── getFullSalaryByGenderAndScoreAll ──────────────────────────────

  describe('getFullSalaryByGenderAndScoreAll', () => {
    it('computes adjusted full salary as (base + additional + bonus) / workRatio', async () => {
      // base 800,000 + additional 150,000 + bonus 50,000 = 1,000,000
      // at 80% work ratio → 1,250,000
      employeeFindAll.mockResolvedValue([
        makeEmployee(300, 800000, 0.8, GenderEnum.MALE, {
          additionalSalary: 150000,
          bonusSalary: 50000,
        }),
      ])

      const result =
        await service.getFullSalaryByGenderAndScoreAll(REPORT_ID)

      expect(result.dataPoints).toHaveLength(1)
      expect(result.dataPoints[0].adjustedSalary).toBe(1250000)
    })

    it('treats null bonusSalary as zero', async () => {
      // base 600,000 + additional 400,000 + bonus null = 1,000,000
      // at 100% work ratio → 1,000,000
      employeeFindAll.mockResolvedValue([
        makeEmployee(300, 600000, 1, GenderEnum.FEMALE, {
          additionalSalary: 400000,
          bonusSalary: null,
        }),
      ])

      const result =
        await service.getFullSalaryByGenderAndScoreAll(REPORT_ID)

      expect(result.dataPoints[0].adjustedSalary).toBe(1000000)
    })

    it('uses total employee score (not work score) for X-axis', async () => {
      employeeFindAll.mockResolvedValue([
        makeEmployee(450, 500000, 1, GenderEnum.MALE, {
          additionalSalary: 100000,
        }),
      ])

      const result =
        await service.getFullSalaryByGenderAndScoreAll(REPORT_ID)

      expect(result.dataPoints[0].score).toBe(450)
    })
  })

  // ── getBaseSalaryGenderWageGap ────────────────────────────────────

  describe('getBaseSalaryGenderWageGap', () => {
    it('returns average and median base salary per gender with wage gap', async () => {
      employeeFindAll.mockResolvedValue([
        makeEmployee(0, 700000, 1, GenderEnum.MALE),
        makeEmployee(0, 800000, 1, GenderEnum.FEMALE),
      ])

      const result = await service.getBaseSalaryGenderWageGap(REPORT_ID)

      expect(result.maleAverageSalary).toBe(700000)
      expect(result.femaleAverageSalary).toBe(800000)
      expect(result.overallAverageSalary).toBe(750000)
      expect(result.maleMedianSalary).toBe(700000)
      expect(result.femaleMedianSalary).toBe(800000)
      expect(result.maleCount).toBe(1)
      expect(result.femaleCount).toBe(1)
    })

    it('computes negative wage gap when females earn more', async () => {
      // male avg 705,160, female avg 804,248
      // gap = (705160 - 804248) / 705160 * 100 = -14.05 → -14.0
      employeeFindAll.mockResolvedValue([
        makeEmployee(0, 705160, 1, GenderEnum.MALE),
        makeEmployee(0, 804248, 1, GenderEnum.FEMALE),
      ])

      const result = await service.getBaseSalaryGenderWageGap(REPORT_ID)

      expect(result.averageWageGapPercent).toBeLessThan(0)
    })

    it('adjusts base salary to 100% work ratio', async () => {
      // 500,000 at 80% → 625,000
      employeeFindAll.mockResolvedValue([
        makeEmployee(0, 500000, 0.8, GenderEnum.MALE),
        makeEmployee(0, 600000, 1, GenderEnum.FEMALE),
      ])

      const result = await service.getBaseSalaryGenderWageGap(REPORT_ID)

      expect(result.maleAverageSalary).toBe(625000)
      expect(result.femaleAverageSalary).toBe(600000)
    })
  })

  // ── getFullSalaryGenderWageGap ────────────────────────────────────

  describe('getFullSalaryGenderWageGap', () => {
    it('uses base + additional + bonus for full salary', async () => {
      // male: 500k + 200k + 50k = 750k at 100%
      // female: 600k + 250k + 100k = 950k at 100%
      employeeFindAll.mockResolvedValue([
        makeEmployee(0, 500000, 1, GenderEnum.MALE, {
          additionalSalary: 200000,
          bonusSalary: 50000,
        }),
        makeEmployee(0, 600000, 1, GenderEnum.FEMALE, {
          additionalSalary: 250000,
          bonusSalary: 100000,
        }),
      ])

      const result = await service.getFullSalaryGenderWageGap(REPORT_ID)

      expect(result.maleAverageSalary).toBe(750000)
      expect(result.femaleAverageSalary).toBe(950000)
      expect(result.averageWageGapPercent).toBeLessThan(0)
    })

    it('provides both average and median wage gap percentages', async () => {
      // 3 males: 400k, 500k, 900k → avg 600k, median 500k
      // 2 females: 600k, 800k → avg 700k, median 700k
      employeeFindAll.mockResolvedValue([
        makeEmployee(0, 400000, 1, GenderEnum.MALE),
        makeEmployee(0, 500000, 1, GenderEnum.MALE),
        makeEmployee(0, 900000, 1, GenderEnum.MALE),
        makeEmployee(0, 600000, 1, GenderEnum.FEMALE),
        makeEmployee(0, 800000, 1, GenderEnum.FEMALE),
      ])

      const result = await service.getFullSalaryGenderWageGap(REPORT_ID)

      // avg gap = (600k - 700k) / 600k * 100 = -16.7
      expect(result.averageWageGapPercent).toBeCloseTo(-16.7, 0)
      // median gap = (500k - 700k) / 500k * 100 = -40.0
      expect(result.medianWageGapPercent).toBe(-40)
    })
  })

  // ── getBenefitsBreakdown ──────────────────────────────────────────

  describe('getBenefitsBreakdown', () => {
    it('returns average bonus and additional per gender (raw, no work ratio adjustment)', async () => {
      // Male: bonus 20k, additional 40k
      // Female: bonus 70k, additional 30k
      employeeFindAll.mockResolvedValue([
        makeEmployee(0, 500000, 0.8, GenderEnum.MALE, {
          additionalSalary: 40000,
          bonusSalary: 20000,
        }),
        makeEmployee(0, 600000, 0.5, GenderEnum.FEMALE, {
          additionalSalary: 30000,
          bonusSalary: 70000,
        }),
      ])

      const result = await service.getBenefitsBreakdown(REPORT_ID)

      // Raw values — work ratio must NOT affect these
      expect(result.male.averageBonusSalary).toBe(20000)
      expect(result.male.averageAdditionalSalary).toBe(40000)
      expect(result.male.averageTotal).toBe(60000)
      expect(result.female.averageBonusSalary).toBe(70000)
      expect(result.female.averageAdditionalSalary).toBe(30000)
      expect(result.female.averageTotal).toBe(100000)
    })

    it('computes overall averages across both genders', async () => {
      employeeFindAll.mockResolvedValue([
        makeEmployee(0, 0, 1, GenderEnum.MALE, {
          additionalSalary: 40000,
          bonusSalary: 20000,
        }),
        makeEmployee(0, 0, 1, GenderEnum.FEMALE, {
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
        makeEmployee(0, 0, 1, GenderEnum.MALE, {
          additionalSalary: 200,
          bonusSalary: 100,
        }),
        makeEmployee(0, 0, 1, GenderEnum.FEMALE, {
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
        makeEmployee(0, 0, 1, GenderEnum.MALE, {
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
        makeEmployee(0, 0, 1, GenderEnum.MALE, { additionalSalary: 100 }),
        makeEmployee(0, 0, 1, GenderEnum.MALE, { additionalSalary: 200 }),
        makeEmployee(0, 0, 1, GenderEnum.FEMALE, { additionalSalary: 300 }),
      ])

      const result = await service.getBenefitsBreakdown(REPORT_ID)

      expect(result.male.count).toBe(2)
      expect(result.female.count).toBe(1)
      expect(result.overall.count).toBe(3)
    })
  })
})
