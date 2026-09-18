import {
  assertParsedPayloadValid,
  computeEmployeeScores,
} from '../../report/lib/employee-scores'
import { GenderEnum } from '../../report/models/report.model'
import { ReportCriterionTypeEnum } from '../../report-criterion/models/report-criterion.model'
import { PartnerEmployeeDto } from '../dto/partner-salary-payload.dto'
import { ScoringModelStatusEnum } from '../dto/scoring-validation.dto'
import { expandToParsedPayload } from './expand-to-parsed-payload'
import { validateScoringModel } from './validate-scoring-model'

/**
 * The test that ties the two halves together.
 *
 * `validateScoringModel` publishes a contract — a model reading `VALID` can be
 * filed — and nothing enforced it. The two rule sets were written separately
 * and diverged: the capacity ceilings, duplicate role titles and duplicate
 * criterion titles were all rejected at filing and silent in the validator, so
 * a model previewed clean and was then refused. Every one of those was found in
 * review rather than in CI, because no test ever fed an expanded model into the
 * gate it claims parity with.
 *
 * This is that test. It needs no server, and it fails the moment the two drift
 * again.
 */

const step = (id: string, order: number) => ({
  id,
  stepOrder: order,
  description: `þrep ${order}`,
})

const sub = (id: string, title: string, weight: number) => ({
  id,
  title,
  description: 'd',
  weight,
  steps: [step(`${id}-1`, 1), step(`${id}-2`, 2), step(`${id}-3`, 3)],
})

const JOB_TYPES = [
  ReportCriterionTypeEnum.RESPONSIBILITY,
  ReportCriterionTypeEnum.STRAIN,
  ReportCriterionTypeEnum.CONDITION,
  ReportCriterionTypeEnum.COMPETENCE,
]

/** Four mandatory types at 25 each, one job assigned across all of them. */
const fileableModel = () => {
  const criteria = JOB_TYPES.map((type, i) => ({
    id: `c-${i}`,
    type,
    title: `Viðmið ${i}`,
    description: 'd',
    weight: 25,
    subCriteria: [sub(`s-${i}`, `Undirviðmið ${i}`, 25)],
  }))

  const roles = [
    {
      id: 'role-1',
      title: 'Sérfræðingur',
      stepAssignments: criteria.map((c) => ({
        subCriterionId: c.subCriteria[0].id,
        stepId: c.subCriteria[0].steps[1].id,
      })),
    },
  ]

  return { criteria, roles }
}

const employees = (count: number): PartnerEmployeeDto[] =>
  Array.from({ length: count }, (_, i) => ({
    ordinal: i + 1,
    identifier: `EMP-${i + 1}`,
    roleId: 'role-1',
    gender: i % 2 ? GenderEnum.MALE : GenderEnum.FEMALE,
    field: null,
    department: null,
    startDate: '2020-01-01',
    paidHours: 173.33,
    baseSalary: 700_000 + i * 25_000,
    personalSteps: [],
  })) as PartnerEmployeeDto[]

describe('a VALID scoring model expands into a payload the filing gate accepts', () => {
  it('is VALID to begin with', () => {
    expect(validateScoringModel(fileableModel()).status).toBe(
      ScoringModelStatusEnum.VALID,
    )
  })

  it('passes `assertParsedPayloadValid` once expanded', () => {
    const parsed = expandToParsedPayload(fileableModel(), employees(8))

    expect(() => assertParsedPayloadValid(parsed)).not.toThrow()
  })

  it('scores every employee from their job, on the shared stig scale', () => {
    const parsed = expandToParsedPayload(fileableModel(), employees(8))
    const scoreByKey = assertParsedPayloadValid(parsed)

    // The map is keyed per þrep, so its maximum is the top þrep of one
    // sub-criterion — (3/3) x 25 x 10 = 250 — not an employee's total. The
    // comment here used to compute 4 x (2/3 x 25 x 10) = 666.67, a different
    // quantity from the one asserted; that total is an employee's score and is
    // reached through `computeEmployeeScores`, which this test never calls.
    const perStep = [...scoreByKey.values()].filter((score) => score > 0)

    expect(Math.max(...perStep)).toBeCloseTo((3 / 3) * 25 * 10, 5)

    // And the employee total the comment was reaching for, computed properly.
    const scores = computeEmployeeScores(parsed, scoreByKey)
    expect([...scores.values()][0]).toBeCloseTo(4 * (2 / 3) * 25 * 10, 5)
  })

  describe('what the validator now refuses, because the gate does', () => {
    // Each of these was VALID before the backstop and threw at filing.
    it('a model over the criterion ceiling', () => {
      const model = fileableModel()
      model.criteria.push({
        id: 'c-extra-1',
        type: ReportCriterionTypeEnum.PERSONAL,
        title: 'Frammistaða',
        description: 'd',
        weight: 0,
        subCriteria: [],
      })
      model.criteria.push({
        id: 'c-extra-2',
        type: ReportCriterionTypeEnum.STRAIN,
        title: 'Aukaálag',
        description: 'd',
        weight: 0,
        subCriteria: [],
      })

      expect(validateScoringModel(model).status).toBe(
        ScoringModelStatusEnum.INVALID,
      )
      expect(() =>
        assertParsedPayloadValid(expandToParsedPayload(model, employees(8))),
      ).toThrow()
    })

    it('two criteria sharing a title', () => {
      const model = fileableModel()
      model.criteria[1].title = model.criteria[0].title

      expect(validateScoringModel(model).status).toBe(
        ScoringModelStatusEnum.INVALID,
      )
      expect(() =>
        assertParsedPayloadValid(expandToParsedPayload(model, employees(8))),
      ).toThrow()
    })

    // The sharpest of the three: the expander resolves an employee's job by
    // title and the scorer builds its role map last-wins, so two same-titled
    // jobs are genuinely indistinguishable downstream — a silent mis-score
    // rather than a refusal, if the integrity check ever stopped catching it.
    it('two jobs sharing a title', () => {
      const model = fileableModel()
      model.roles.push({ ...model.roles[0], id: 'role-2' })

      expect(validateScoringModel(model).status).toBe(
        ScoringModelStatusEnum.INVALID,
      )
      expect(() =>
        assertParsedPayloadValid(expandToParsedPayload(model, employees(8))),
      ).toThrow()
    })
  })

  // Named for what it actually asserts. It used to be called "cannot express a
  // negative weight, because the DTO refuses it", which is the opposite of what
  // it does — it proves nothing downstream rejects a negative weight, which is
  // *why* the bound has to sit on the DTO. The bound itself is pinned in
  // `scoring-dto-bounds.spec.ts`; a reader auditing this file would otherwise
  // have believed it was pinned here.
  it('nothing downstream rejects a negative weight — which is why the DTO must', () => {
    const model = fileableModel()
    model.criteria[0].subCriteria[0].weight = 60
    model.criteria[1].subCriteria[0].weight = 60
    model.criteria[2].subCriteria[0].weight = -20
    model.criteria[3].subCriteria[0].weight = 0

    const parsed = expandToParsedPayload(model, employees(8))
    const negative = parsed.criteria
      .flatMap((c) => c.subCriteria)
      .flatMap((s) => s.steps)
      .filter((st) => st.score < 0)

    // Nothing downstream rejects these — which is exactly why the guard has to
    // sit on the DTO, where `@Min(0)` now refuses the value on the way in.
    expect(negative.length).toBeGreaterThan(0)
  })
})
