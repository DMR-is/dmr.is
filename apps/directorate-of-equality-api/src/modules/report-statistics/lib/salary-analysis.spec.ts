import {
  computeWageGapDecomposition,
  PayStatusEnum,
  roundWageGapDecompositionSnapshot,
  WageGapBlockerEnum,
} from '../../report/lib/wage-gap-decomposition'
import { GenderEnum } from '../../report/models/report.enums'
import { ReportCriterionTypeEnum } from '../../report-criterion/models/report-criterion.model'
import type { ParsedReportDto } from '../../report-excel/dto/parsed-report.dto'
import { analyzeSalaryPayload } from './salary-analysis'

const THRESHOLD_PERCENT = 3.9

/**
 * Hours that make the fixture figures readable: 600.000 / 173,33 ≈ 3.462 kr./klst.
 * Fixtures using `paidHours: 1` produce million-króna hourly rates, which pass
 * every assertion while describing nothing real.
 */
const PAID_HOURS = 173.33

describe('analyzeSalaryPayload', () => {
  describe('wage gap decomposition', () => {
    it('returns exactly what the persisted submit path would compute', () => {
      const parsed = makeMixedPayload()

      const result = analyzeSalaryPayload(parsed, THRESHOLD_PERCENT)

      // Recomputed independently from the same rows, through the same rounding
      // the submit path applies. This equality IS the feature: the leiðréttur
      // launamunur an applicant previews must be the figure that gets frozen
      // onto report_result, not an approximation of it.
      const expected = roundWageGapDecompositionSnapshot(
        computeWageGapDecomposition({
          employees: parsed.employees.map((employee) => ({
            ordinal: employee.ordinal,
            gender: employee.gender,
            score: expectedScoreFor(employee.roleTitle),
            hourlyWage: expectedHourlyWageFor(employee),
          })),
          benchmarkPercent: THRESHOLD_PERCENT,
        }),
      )

      expect(result.wageGapDecomposition).toEqual(expected)
    })

    it('computes a real gap on the fixture rather than silently nulling out', () => {
      const result = analyzeSalaryPayload(makeMixedPayload(), THRESHOLD_PERCENT)
      const gap = result.wageGapDecomposition

      expect(gap.rawGapAvailable).toBe(true)
      expect(gap.oskyrtAvailable).toBe(true)
      expect(gap.rawGapBlockers).toEqual([])
      expect(gap.counts).toEqual({ male: 4, female: 4, excluded: 0 })
      expect(gap.oskyrtPercent).toBeGreaterThan(0)
      expect(gap.employees).toHaveLength(8)
    })

    // The threshold is now passed WHOLE. It used to be halved into a
    // per-employee ±1,95% band as well; that band is retired, so a single
    // config value has a single meaning again.
    it('passes the benchmark through whole, not halved', () => {
      const result = analyzeSalaryPayload(makeMixedPayload(), THRESHOLD_PERCENT)

      expect(result.wageGapDecomposition.benchmarkPercent).toBe(
        THRESHOLD_PERCENT,
      )
    })
  })

  describe('outliers — now the lágmarksmengi', () => {
    it('returns exactly the employees flagged inMinimumSet, and nobody else', () => {
      const result = analyzeSalaryPayload(makeMixedPayload(), THRESHOLD_PERCENT)

      const expected = result.wageGapDecomposition.employees
        .filter((employee) => employee.inMinimumSet)
        .map((employee) => employee.ordinal)

      expect(result.outliers.map((o) => o.employeeOrdinal)).toEqual(expected)
      // Guard every assertion below against passing vacuously: this fixture's
      // óskýrt must actually exceed 3,9%, or there is nothing to correct.
      expect(expected.length).toBeGreaterThan(0)
    })

    // The set is lift-only by construction. An OVERPAID member would mean the
    // engine was proposing a pay cut — see the guard in wage-gap-decomposition.
    it('never includes an overpaid employee', () => {
      const result = analyzeSalaryPayload(makeMixedPayload(), THRESHOLD_PERCENT)

      expect(result.outliers.length).toBeGreaterThan(0)
      for (const outlier of result.outliers) {
        expect(outlier.payStatus).toBe(PayStatusEnum.UNDERPAID)
        expect(outlier.deviationPercent).toBeLessThan(0)
      }
    })

    // A compliant company needs no úrbótaáætlun at all. Under the band it could
    // still have flagged employees, which is the failure decision #13 names.
    it('is empty when the company is already under the benchmark', () => {
      // A generous benchmark no real cohort could breach.
      const result = analyzeSalaryPayload(makeMixedPayload(), 99)

      expect(result.outliers).toEqual([])
      expect(result.wageGapDecomposition.minimumSetSize).toBe(0)
      // ...and the gap is still computed and reported, just not actionable.
      expect(result.wageGapDecomposition.oskyrtPercent).not.toBeNull()
    })

    it('returns the shape with a blocker when one gender is absent', () => {
      const parsed = makeMixedPayload()
      for (const employee of parsed.employees) {
        employee.gender = GenderEnum.MALE
      }

      const result = analyzeSalaryPayload(parsed, THRESHOLD_PERCENT)
      const gap = result.wageGapDecomposition

      expect(gap.oskyrtAvailable).toBe(false)
      expect(gap.rawGapBlockers).toContain(
        WageGapBlockerEnum.EMPTY_FEMALE_COHORT,
      )
      expect(gap.oskyrtPercent).toBeNull()
      // Counts stay real even when the figures cannot be — they are the
      // actionable half of the message ("you have 0 women, we need at least 1").
      expect(gap.counts).toEqual({ male: 8, female: 0, excluded: 0 })
      // ...and the rest of the analysis is unaffected by the gate.
      expect(
        result.regularHourlyWageByScoreAll.dataPoints,
      ).toHaveLength(8)
    })
  })

  describe('chart', () => {
    // Regression guard: the hourly wage is now derived once and shared between
    // the chart and the decomposition. If that sharing ever regresses to two
    // independent derivations, the two halves of one screen can disagree.
    it('plots reglulegt tímakaup, not monthly salary', () => {
      const result = analyzeSalaryPayload(makeMixedPayload(), THRESHOLD_PERCENT)

      const points = result.regularHourlyWageByScoreAll.dataPoints
      expect(points).toHaveLength(8)
      for (const point of points) {
        // ~3.400–4.400 kr./klst. on this fixture. A monthly figure would be
        // three orders of magnitude larger.
        expect(point.regularHourlyWage).toBeGreaterThan(3000)
        expect(point.regularHourlyWage).toBeLessThan(5000)
      }
    })
  })
})

/** Score per role: Manager reaches the 20-point step, Clerk the 10-point one. */
function expectedScoreFor(roleTitle: string): number {
  return roleTitle === 'Manager' ? 20 : 10
}

function expectedHourlyWageFor(
  employee: ParsedReportDto['employees'][number],
): number {
  const regularWages =
    employee.baseSalary +
    (employee.additionalFixedOvertime ?? 0) +
    (employee.additionalFixedCarAllowance ?? 0) +
    (employee.bonusOccasionalCarAllowance ?? 0) +
    (employee.bonusOccasionalOvertime ?? 0) +
    (employee.bonusPayments ?? 0) +
    (employee.bonusOther ?? 0)

  return regularWages / employee.paidHours
}

/**
 * Four karlar and four konur across two roles, men paid above women in both —
 * so the cohort has a raw gap AND score variation, which is what the
 * decomposition needs to split skýrt from óskýrt. Scores come from the roles
 * rather than personal assignments, keeping the fixture clear of the
 * MAX_PERSONAL_CRITERIA cap.
 */
function makeMixedPayload(): ParsedReportDto {
  return {
    criteria: [
      {
        type: ReportCriterionTypeEnum.RESPONSIBILITY,
        title: 'Responsibility',
        description: 'Responsibility',
        weight: 15,
        subCriteria: [
          {
            title: 'People responsibility',
            description: 'People responsibility',
            weight: 5,
            steps: [
              { order: 1, description: 'low', score: 10 },
              { order: 2, description: 'high', score: 20 },
            ],
          },
        ],
      },
    ],
    roles: [
      {
        title: 'Manager',
        stepAssignments: [
          {
            criterionTitle: 'Responsibility',
            subTitle: 'People responsibility',
            stepOrder: 2,
          },
        ],
      },
      {
        title: 'Clerk',
        stepAssignments: [
          {
            criterionTitle: 'Responsibility',
            subTitle: 'People responsibility',
            stepOrder: 1,
          },
        ],
      },
    ],
    employees: [
      makeEmployee(1, GenderEnum.MALE, 'Manager', 760_000),
      makeEmployee(2, GenderEnum.MALE, 'Manager', 745_000),
      makeEmployee(3, GenderEnum.MALE, 'Clerk', 625_000),
      makeEmployee(4, GenderEnum.MALE, 'Clerk', 610_000),
      makeEmployee(5, GenderEnum.FEMALE, 'Manager', 720_000),
      makeEmployee(6, GenderEnum.FEMALE, 'Manager', 705_000),
      makeEmployee(7, GenderEnum.FEMALE, 'Clerk', 600_000),
      makeEmployee(8, GenderEnum.FEMALE, 'Clerk', 592_000),
    ],
  }
}

function makeEmployee(
  ordinal: number,
  gender: GenderEnum,
  roleTitle: string,
  baseSalary: number,
): ParsedReportDto['employees'][number] {
  return {
    ordinal,
    identifier: `TVE-${String(ordinal).padStart(3, '0')}`,
    roleTitle,
    gender,
    field: 'Management',
    department: 'Operations',
    startDate: '2021-01-01',
    paidHours: PAID_HOURS,
    baseSalary,
    additionalFixedOvertime: null,
    additionalFixedCarAllowance: null,
    bonusOccasionalCarAllowance: null,
    bonusOccasionalOvertime: null,
    bonusPayments: null,
    bonusOther: null,
    personalStepAssignments: [],
  }
}
