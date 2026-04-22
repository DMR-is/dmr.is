/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { GenderEnum } from '../../report/models/report.model'
import { ReportCriterionTypeEnum } from '../../report-criterion/models/report-criterion.model'
import { EducationEnum } from '../../report-employee/models/report-employee.model'
import {
  ParsedCriterionDto,
  ParsedEmployeeDto,
  ParsedReportDto,
  ParsedRoleDto,
} from '../dto/parsed-report.dto'
import { ErrorBag } from '../parser/errors'
import { validateSemantics } from './semantic.validator'

const crit = (
  type: ReportCriterionTypeEnum,
  title: string,
  weight: number,
  subs: { title: string; weight: number; numSteps?: number }[] = [],
): ParsedCriterionDto => ({
  type,
  title,
  description: 'x',
  weight,
  subCriteria: subs.map((s) => ({
    title: s.title,
    description: 'x',
    weight: s.weight,
    steps: Array.from({ length: s.numSteps ?? 5 }, (_, i) => ({
      order: i + 1,
      description: `step ${i + 1}`,
      score: (i + 1) * 10,
    })),
  })),
})

const role = (
  title: string,
  stepAssignments: ParsedRoleDto['stepAssignments'] = [],
): ParsedRoleDto => ({ title, stepAssignments })

const employee = (
  ordinal: number,
  roleTitle: string,
  personalStepAssignments: ParsedEmployeeDto['personalStepAssignments'] = [],
): ParsedEmployeeDto => ({
  ordinal,
  roleTitle,
  education: EducationEnum.BACHELOR,
  gender: GenderEnum.NEUTRAL,
  field: 'x',
  department: 'x',
  startDate: '2024-01-01',
  workRatio: 1,
  baseSalary: 1000,
  additionalSalary: 0,
  bonusSalary: null,
  personalStepAssignments,
})

/** Minimal fully-valid report: 4 mandatory job-based + 1 personal, all weights sum to 100. */
const validReport = (): ParsedReportDto => {
  const criteria: ParsedCriterionDto[] = [
    crit(ReportCriterionTypeEnum.RESPONSIBILITY, 'Ábyrgð', 30, [
      { title: 'A', weight: 30 },
    ]),
    crit(ReportCriterionTypeEnum.STRAIN, 'Álag', 20, [
      { title: 'B', weight: 20 },
    ]),
    crit(ReportCriterionTypeEnum.CONDITION, 'Vinnuaðstæður', 20, [
      { title: 'C', weight: 20 },
    ]),
    crit(ReportCriterionTypeEnum.COMPETENCE, 'Hæfni', 20, [
      { title: 'D', weight: 20 },
    ]),
    crit(ReportCriterionTypeEnum.PERSONAL, 'Sérhæfing', 10, [
      { title: 'E', weight: 10 },
    ]),
  ]

  const roleAssignments = [
    { criterionTitle: 'Ábyrgð', subTitle: 'A', stepOrder: 3 },
    { criterionTitle: 'Álag', subTitle: 'B', stepOrder: 3 },
    { criterionTitle: 'Vinnuaðstæður', subTitle: 'C', stepOrder: 3 },
    { criterionTitle: 'Hæfni', subTitle: 'D', stepOrder: 3 },
  ]
  const personalAssignments = [
    { criterionTitle: 'Sérhæfing', subTitle: 'E', stepOrder: 3 },
  ]

  return {
    criteria,
    roles: [role('Worker', roleAssignments)],
    employees: [employee(1, 'Worker', personalAssignments)],
  }
}

const runValidator = (report: ParsedReportDto) => {
  const bag = new ErrorBag()
  validateSemantics(report, bag)
  return bag.list
}

describe('validateSemantics', () => {
  it('accepts a fully valid report with no errors', () => {
    expect(runValidator(validReport())).toEqual([])
  })

  describe('mandatory criteria', () => {
    it('rejects a report missing one of the four mandatory job-based types', () => {
      const report = validReport()
      report.criteria = report.criteria.filter(
        (c) => c.type !== ReportCriterionTypeEnum.CONDITION,
      )
      // Re-balance weights so we only trigger the mandatory-missing error, not weight-sum.
      report.criteria.forEach((c) => {
        if (c.type === ReportCriterionTypeEnum.STRAIN) c.weight = 40
      })
      // Sub weight rebalance too
      const strain = report.criteria.find(
        (c) => c.type === ReportCriterionTypeEnum.STRAIN,
      )!
      strain.subCriteria[0].weight = 40
      const errors = runValidator(report)
      expect(errors.some((e) => e.message.includes('CONDITION'))).toBe(true)
    })

    it('rejects a report missing multiple mandatory types', () => {
      const report = validReport()
      report.criteria = report.criteria.filter(
        (c) =>
          c.type === ReportCriterionTypeEnum.RESPONSIBILITY ||
          c.type === ReportCriterionTypeEnum.PERSONAL,
      )
      const errors = runValidator(report)
      const missing = errors
        .filter((e) => e.message.includes('Mandatory'))
        .map((e) => e.message)
      expect(missing).toHaveLength(3) // STRAIN, CONDITION, COMPETENCE
    })
  })

  describe('weight sums', () => {
    it('rejects top-level weights not summing to 100', () => {
      const report = validReport()
      report.criteria[0].weight = 25 // now sums to 95
      const errors = runValidator(report)
      expect(
        errors.some((e) => e.message.includes('Criterion weights sum to 95')),
      ).toBe(true)
    })

    it('rejects sub-criterion weights not summing to 100', () => {
      const report = validReport()
      report.criteria[0].subCriteria[0].weight = 25 // now sums to 95
      const errors = runValidator(report)
      expect(
        errors.some((e) =>
          e.message.includes('Sub-criterion weights sum to 95'),
        ),
      ).toBe(true)
    })

    it('tolerates floating-point rounding within epsilon', () => {
      const report = validReport()
      // 30 + 20 + 20 + 20 + 10 = 100 exactly; perturb by 0.001
      report.criteria[0].weight = 30.001
      report.criteria[0].subCriteria[0].weight = 30.001
      const errors = runValidator(report)
      expect(errors.some((e) => e.message.includes('weights sum to'))).toBe(
        false,
      )
    })
  })

  describe('minimum population', () => {
    it('rejects zero roles', () => {
      const report = validReport()
      report.roles = []
      const errors = runValidator(report)
      expect(
        errors.some((e) => e.message === 'At least one role is required'),
      ).toBe(true)
    })

    it('rejects zero employees', () => {
      const report = validReport()
      report.employees = []
      const errors = runValidator(report)
      expect(
        errors.some((e) => e.message === 'At least one employee is required'),
      ).toBe(true)
    })
  })

  describe('role reference integrity', () => {
    it('rejects an employee referencing an unknown role title', () => {
      const report = validReport()
      report.employees[0].roleTitle = 'Ghost'
      const errors = runValidator(report)
      expect(
        errors.some((e) =>
          e.message.includes('references unknown role "Ghost"'),
        ),
      ).toBe(true)
    })
  })

  describe('role classification completeness', () => {
    it('rejects a role missing one job-based sub assignment', () => {
      const report = validReport()
      report.roles[0].stepAssignments.pop() // drop Hæfni
      const errors = runValidator(report)
      expect(errors.some((e) => e.message.includes('missing assignment'))).toBe(
        true,
      )
    })

    it('rejects a role with a duplicate assignment', () => {
      const report = validReport()
      report.roles[0].stepAssignments.push({
        criterionTitle: 'Ábyrgð',
        subTitle: 'A',
        stepOrder: 5,
      })
      const errors = runValidator(report)
      expect(
        errors.some((e) => e.message.includes('has 2 assignments for')),
      ).toBe(true)
    })
  })

  describe('employee classification completeness', () => {
    it('rejects an employee missing one personal sub assignment', () => {
      const report = validReport()
      report.employees[0].personalStepAssignments = []
      const errors = runValidator(report)
      expect(
        errors.some(
          (e) =>
            e.message.includes('missing assignment') &&
            e.message.includes('#1'),
        ),
      ).toBe(true)
    })

    it('does not penalise an employee for missing job-based assignments (those live on role)', () => {
      // A report with no personal sub-criteria at all → employees need zero
      // personal assignments, and the completeness check for employees should
      // not complain.
      const report = validReport()
      // Drop the only personal criterion
      report.criteria = report.criteria.filter(
        (c) => c.type !== ReportCriterionTypeEnum.PERSONAL,
      )
      // Rebalance so weight-sum checks stay happy
      report.criteria.forEach((c) => {
        if (c.type === ReportCriterionTypeEnum.RESPONSIBILITY) c.weight = 40
      })
      const resp = report.criteria.find(
        (c) => c.type === ReportCriterionTypeEnum.RESPONSIBILITY,
      )!
      resp.subCriteria[0].weight = 40
      report.employees[0].personalStepAssignments = []
      const errors = runValidator(report)
      expect(
        errors.some(
          (e) =>
            e.message.includes('missing assignment') &&
            e.message.includes('Employee'),
        ),
      ).toBe(false)
    })
  })
})
