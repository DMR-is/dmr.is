import { BadRequestException } from '@nestjs/common'

import { GenderEnum } from '../../report/models/report.model'
import { ReportCriterionTypeEnum } from '../../report-criterion/models/report-criterion.model'
import { SCORE_FACTOR } from '../../report-excel/workbook.schema'
import { PartnerEmployeeDto } from '../dto/partner-salary-payload.dto'
import { expandToParsedPayload } from './expand-to-parsed-payload'

const step = (id: string, order: number) => ({
  id,
  stepOrder: order,
  description: `þrep ${order}`,
})

const jobCriterion = () => ({
  id: 'c-job',
  type: ReportCriterionTypeEnum.RESPONSIBILITY,
  title: 'Ábyrgð',
  description: 'd',
  weight: 60,
  subCriteria: [
    {
      id: 'sub-job',
      title: 'Mannaforráð',
      description: 'd',
      weight: 60,
      steps: [step('job-1', 1), step('job-2', 2), step('job-3', 3)],
    },
  ],
})

const personalCriterion = () => ({
  id: 'c-personal',
  type: ReportCriterionTypeEnum.PERSONAL,
  title: 'Frammistaða',
  description: 'd',
  weight: 40,
  subCriteria: [
    {
      id: 'sub-personal',
      title: 'Menntun',
      description: 'd',
      weight: 40,
      steps: [step('per-1', 1), step('per-2', 2)],
    },
  ],
})

const model = () => ({
  criteria: [jobCriterion(), personalCriterion()],
  roles: [
    {
      id: 'role-1',
      title: 'Sérfræðingur',
      stepAssignments: [{ subCriterionId: 'sub-job', stepId: 'job-2' }],
    },
  ],
})

const employee = (
  overrides: Partial<PartnerEmployeeDto> = {},
): PartnerEmployeeDto =>
  ({
    ordinal: 1,
    identifier: 'ABC-001',
    roleId: 'role-1',
    gender: GenderEnum.FEMALE,
    field: null,
    department: null,
    startDate: '2020-01-01',
    paidHours: 173.33,
    baseSalary: 800000,
    personalSteps: [{ subCriterionId: 'sub-personal', stepId: 'per-2' }],
    ...overrides,
  }) as PartnerEmployeeDto

describe('expandToParsedPayload', () => {
  it('produces the criteria tree the pipeline expects', () => {
    const parsed = expandToParsedPayload(model(), [employee()])

    expect(parsed.criteria).toHaveLength(2)
    expect(parsed.criteria[0]).toMatchObject({
      type: ReportCriterionTypeEnum.RESPONSIBILITY,
      title: 'Ábyrgð',
      weight: 60,
    })
  })

  // The score is derived, never carried: a vendor sending its own could put a
  // report on a different stig scale from every other one in the register, and
  // nothing downstream validates the scale.
  it('derives each step score from the scale’s own length', () => {
    const parsed = expandToParsedPayload(model(), [employee()])
    const steps = parsed.criteria[0].subCriteria[0].steps

    // (order / numSteps) x weight x SCORE_FACTOR
    expect(steps.map((s) => s.score)).toEqual([
      (1 / 3) * 60 * SCORE_FACTOR,
      (2 / 3) * 60 * SCORE_FACTOR,
      (3 / 3) * 60 * SCORE_FACTOR,
    ])
  })

  it('gives the top step of any scale the sub-criterion’s full weight', () => {
    const twoStep = model()
    const parsed = expandToParsedPayload(twoStep, [employee()])
    const personal = parsed.criteria[1].subCriteria[0]

    expect(personal.steps[personal.steps.length - 1].score).toBe(
      40 * SCORE_FACTOR,
    )
  })

  describe('id to title translation', () => {
    it('resolves a role assignment to its title triple', () => {
      const parsed = expandToParsedPayload(model(), [employee()])

      expect(parsed.roles[0].stepAssignments).toEqual([
        { criterionTitle: 'Ábyrgð', subTitle: 'Mannaforráð', stepOrder: 2 },
      ])
    })

    it('resolves an employee’s job id to the title the pipeline matches on', () => {
      const parsed = expandToParsedPayload(model(), [employee()])

      expect(parsed.employees[0].roleTitle).toBe('Sérfræðingur')
    })

    it('resolves personal steps to title triples', () => {
      const parsed = expandToParsedPayload(model(), [employee()])

      expect(parsed.employees[0].personalStepAssignments).toEqual([
        { criterionTitle: 'Frammistaða', subTitle: 'Menntun', stepOrder: 2 },
      ])
    })

    // Titles are unconstrained, and the pipeline keys on the pair — so a model
    // that would collapse two rows onto one key is refused here rather than
    // emitting a payload that scores wrong.
    it('refuses a model with two identically-titled sub-criteria', () => {
      const duplicated = model()
      duplicated.criteria[1].title = 'Ábyrgð'
      duplicated.criteria[1].subCriteria[0].title = 'Mannaforráð'

      expect(() => expandToParsedPayload(duplicated, [employee()])).toThrow(
        BadRequestException,
      )
    })
  })

  describe('refusals', () => {
    it('refuses an employee whose job is not in the model', () => {
      expect(() =>
        expandToParsedPayload(model(), [employee({ roleId: 'elsewhere' })]),
      ).toThrow(BadRequestException)
    })

    it('refuses a personal step on a job-based sub-criterion', () => {
      expect(() =>
        expandToParsedPayload(model(), [
          employee({
            personalSteps: [{ subCriterionId: 'sub-job', stepId: 'job-1' }],
          }),
        ]),
      ).toThrow(/metið á starf, ekki starfsmann/)
    })

    it('refuses a step that belongs to another sub-criterion', () => {
      expect(() =>
        expandToParsedPayload(model(), [
          employee({
            personalSteps: [
              { subCriterionId: 'sub-personal', stepId: 'job-1' },
            ],
          }),
        ]),
      ).toThrow(BadRequestException)
    })

    it('refuses a sub-criterion outside the model', () => {
      expect(() =>
        expandToParsedPayload(model(), [
          employee({
            personalSteps: [{ subCriterionId: 'nope', stepId: 'per-1' }],
          }),
        ]),
      ).toThrow(BadRequestException)
    })
  })

  it('passes payroll fields through, normalising absent optionals to null', () => {
    const parsed = expandToParsedPayload(model(), [
      employee({ baseSalary: 950000, paidHours: 160 }),
    ])

    expect(parsed.employees[0]).toMatchObject({
      ordinal: 1,
      identifier: 'ABC-001',
      baseSalary: 950000,
      paidHours: 160,
      additionalFixedOvertime: null,
      additionalFixedOther: null,
      bonusOther: null,
    })
  })

  it('takes an empty payroll extract without inventing employees', () => {
    const parsed = expandToParsedPayload(model(), [])

    expect(parsed.employees).toEqual([])
    expect(parsed.criteria).toHaveLength(2)
  })
})
