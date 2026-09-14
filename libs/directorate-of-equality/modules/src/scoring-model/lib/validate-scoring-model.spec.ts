import { ReportCriterionTypeEnum } from '../../report-criterion/models/report-criterion.model'
import { ScoringCriterionDto } from '../dto/scoring-criterion.dto'
import { ScoringRoleDto } from '../dto/scoring-model.dto'
import {
  ScoringModelStatusEnum,
  ScoringValidationScopeEnum,
} from '../dto/scoring-validation.dto'
import { validateScoringModel } from './validate-scoring-model'

type SubSpec = {
  id: string
  title?: string
  weight: number
  stepOrders?: number[]
}

const sub = ({ id, title, weight, stepOrders = [1, 2, 3] }: SubSpec) => ({
  id,
  title: title ?? `sub-${id}`,
  description: 'd',
  weight,
  steps: stepOrders.map((stepOrder) => ({
    id: `${id}-step-${stepOrder}`,
    stepOrder,
    description: 'þrep',
  })),
})

const criterion = (
  type: ReportCriterionTypeEnum,
  subCriteria: ReturnType<typeof sub>[],
): ScoringCriterionDto => ({
  id: `criterion-${type}`,
  type,
  title: String(type),
  description: 'd',
  weight: subCriteria.reduce((t, s) => t + s.weight, 0),
  subCriteria,
})

/**
 * The smallest model that passes every rule: one criterion of each mandatory
 * job-based type, weights totalling 100, contiguous steps, and one role
 * assigned on every job-based sub-criterion.
 */
const validModel = () => {
  const subs = {
    resp: sub({ id: 'r1', weight: 25 }),
    strain: sub({ id: 's1', weight: 25 }),
    cond: sub({ id: 'c1', weight: 25 }),
    comp: sub({ id: 'k1', weight: 25 }),
  }

  const criteria = [
    criterion(ReportCriterionTypeEnum.RESPONSIBILITY, [subs.resp]),
    criterion(ReportCriterionTypeEnum.STRAIN, [subs.strain]),
    criterion(ReportCriterionTypeEnum.CONDITION, [subs.cond]),
    criterion(ReportCriterionTypeEnum.COMPETENCE, [subs.comp]),
  ]

  const roles: ScoringRoleDto[] = [
    {
      id: 'role-1',
      title: 'Sérfræðingur',
      stepAssignments: Object.values(subs).map((s) => ({
        subCriterionId: s.id,
        stepId: s.steps[0].id,
      })),
    },
  ]

  return { criteria, roles }
}

const scopesOf = (model: ReturnType<typeof validModel>) =>
  validateScoringModel(model).reasons.map((r) => r.scope)

const messagesOf = (model: ReturnType<typeof validModel>) =>
  validateScoringModel(model).reasons.map((r) => r.message)

describe('validateScoringModel', () => {
  it('accepts the smallest complete model', () => {
    const result = validateScoringModel(validModel())

    expect(result.status).toBe(ScoringModelStatusEnum.VALID)
    expect(result.reasons).toEqual([])
  })

  it('reports an empty model against every rule it can, not just the first', () => {
    const result = validateScoringModel({ criteria: [], roles: [] })

    expect(result.status).toBe(ScoringModelStatusEnum.INVALID)
    // Four missing mandatory types plus "no sub-criteria" — a first-time
    // integration should learn all of it in one round trip.
    expect(result.reasons).toHaveLength(5)
    expect(
      result.reasons.filter(
        (r) => r.scope === ScoringValidationScopeEnum.CRITERIA,
      ),
    ).toHaveLength(4)
  })

  describe('mandatory criterion types', () => {
    it.each([
      ReportCriterionTypeEnum.RESPONSIBILITY,
      ReportCriterionTypeEnum.STRAIN,
      ReportCriterionTypeEnum.CONDITION,
      ReportCriterionTypeEnum.COMPETENCE,
    ])('names %s when no criterion carries that type', (missing) => {
      const model = validModel()
      model.criteria = model.criteria.filter((c) => c.type !== missing)

      expect(messagesOf(model)).toEqual(
        expect.arrayContaining([expect.stringContaining(missing)]),
      )
    })

    it('is satisfied by the type, so two criteria of one type are fine', () => {
      const model = validModel()
      const extra = criterion(ReportCriterionTypeEnum.RESPONSIBILITY, [])
      extra.id = 'criterion-second-responsibility'
      model.criteria.push(extra)

      expect(scopesOf(model)).not.toContain(
        ScoringValidationScopeEnum.CRITERIA,
      )
    })

    it('refuses more than one personal criterion', () => {
      const model = validModel()
      const p1 = criterion(ReportCriterionTypeEnum.PERSONAL, [])
      const p2 = criterion(ReportCriterionTypeEnum.PERSONAL, [])
      p1.id = 'personal-1'
      p2.id = 'personal-2'
      model.criteria.push(p1, p2)

      expect(messagesOf(model)).toEqual(
        expect.arrayContaining([
          expect.stringContaining('einstaklingsbundið viðmið'),
        ]),
      )
    })
  })

  describe('weights', () => {
    it('sums sub-criteria across the whole model, not within each criterion', () => {
      // 40 + 20 + 20 + 20 = 100 overall, while no single criterion is at 100.
      const model = validModel()
      model.criteria[0].subCriteria[0].weight = 40
      model.criteria[1].subCriteria[0].weight = 20
      model.criteria[2].subCriteria[0].weight = 20
      model.criteria[3].subCriteria[0].weight = 20

      expect(validateScoringModel(model).status).toBe(
        ScoringModelStatusEnum.VALID,
      )
    })

    it('reports the running total when it is over', () => {
      const model = validModel()
      model.criteria[0].subCriteria[0].weight = 35

      expect(messagesOf(model)).toEqual(
        expect.arrayContaining([expect.stringContaining('110')]),
      )
    })

    it('reports the running total when it is under', () => {
      const model = validModel()
      model.criteria[0].subCriteria[0].weight = 15

      expect(messagesOf(model)).toEqual(
        expect.arrayContaining([expect.stringContaining('90')]),
      )
    })

    it('tolerates floating-point drift within the epsilon', () => {
      const model = validModel()
      model.criteria[0].subCriteria[0].weight = 25.005

      expect(validateScoringModel(model).status).toBe(
        ScoringModelStatusEnum.VALID,
      )
    })

    it('says the model has nothing to score when it has no sub-criteria', () => {
      const model = validModel()
      model.criteria = model.criteria.map((c) => ({ ...c, subCriteria: [] }))
      model.roles = [{ id: 'role-1', title: 'Sérfræðingur', stepAssignments: [] }]

      expect(scopesOf(model)).toContain(
        ScoringValidationScopeEnum.SUB_CRITERIA,
      )
    })
  })

  describe('steps', () => {
    it('requires a sub-criterion to have a scale at all', () => {
      const model = validModel()
      model.criteria[0].subCriteria[0].steps = []

      expect(messagesOf(model)).toEqual(
        expect.arrayContaining([expect.stringContaining('engin þrep')]),
      )
    })

    // The score is (stepOrder / numSteps) x weight x SCORE_FACTOR, so a gap
    // puts the top step above the scale's own maximum: orders 1, 2 and 5 give
    // three steps and a last step scoring 5/3 of what it should.
    it('refuses orders that are not contiguous from 1', () => {
      const model = validModel()
      model.criteria[0].subCriteria[0] = sub({
        id: 'r1',
        weight: 25,
        stepOrders: [1, 2, 5],
      })

      expect(messagesOf(model)).toEqual(
        expect.arrayContaining([expect.stringContaining('samfelld frá 1')]),
      )
    })

    it('refuses a scale that does not start at 1', () => {
      const model = validModel()
      model.criteria[0].subCriteria[0] = sub({
        id: 'r1',
        weight: 25,
        stepOrders: [2, 3, 4],
      })

      expect(scopesOf(model)).toContain(ScoringValidationScopeEnum.STEPS)
    })

    it('refuses a scale shorter than the filing allows', () => {
      const model = validModel()
      model.criteria[0].subCriteria[0] = sub({
        id: 'r1',
        weight: 25,
        stepOrders: [1],
      })

      expect(messagesOf(model)).toEqual(
        expect.arrayContaining([expect.stringContaining('leyfilegt bil er')]),
      )
    })

    it('refuses a scale longer than the filing allows', () => {
      const model = validModel()
      model.criteria[0].subCriteria[0] = sub({
        id: 'r1',
        weight: 25,
        stepOrders: [1, 2, 3, 4, 5, 6, 7, 8, 9],
      })

      expect(messagesOf(model)).toEqual(
        expect.arrayContaining([expect.stringContaining('leyfilegt bil er')]),
      )
    })

    // 2..8 inclusive, matching `assertParsedPayloadIntegrity`. A scale this
    // validator accepts must never be refused at submit for its length.
    it.each([2, 8])('accepts a scale of %i steps', (n) => {
      const model = validModel()
      model.criteria[0].subCriteria[0] = sub({
        id: 'r1',
        weight: 25,
        stepOrders: Array.from({ length: n }, (_, i) => i + 1),
      })

      expect(scopesOf(model)).not.toContain(ScoringValidationScopeEnum.STEPS)
    })

    it('accepts contiguous orders given out of sequence', () => {
      const model = validModel()
      model.criteria[0].subCriteria[0] = sub({
        id: 'r1',
        weight: 25,
        stepOrders: [3, 1, 2],
      })

      expect(scopesOf(model)).not.toContain(ScoringValidationScopeEnum.STEPS)
    })
  })

  describe('role assignments', () => {
    it('names each job-based sub-criterion a role is not assigned on', () => {
      const model = validModel()
      model.roles[0].stepAssignments = model.roles[0].stepAssignments.slice(1)

      const reasons = validateScoringModel(model).reasons.filter(
        (r) => r.scope === ScoringValidationScopeEnum.ROLE_ASSIGNMENTS,
      )

      expect(reasons).toHaveLength(1)
      expect(reasons[0].message).toContain('Sérfræðingur')
    })

    // A role owns the job-based criteria; the personal ones are scored per
    // employee, so a role must never be assigned on them.
    it('refuses a role assigned onto a personal sub-criterion', () => {
      const model = validModel()
      const personalSub = sub({ id: 'p1', weight: 0 })
      const personal = criterion(ReportCriterionTypeEnum.PERSONAL, [
        personalSub,
      ])
      model.criteria.push(personal)
      model.roles[0].stepAssignments.push({
        subCriterionId: personalSub.id,
        stepId: personalSub.steps[0].id,
      })

      expect(messagesOf(model)).toEqual(
        expect.arrayContaining([
          expect.stringContaining('metið á starfsmann, ekki starf'),
        ]),
      )
    })

    it('does not require a role to be assigned on personal sub-criteria', () => {
      const model = validModel()
      const personalSub = sub({ id: 'p1', weight: 0 })
      model.criteria.push(
        criterion(ReportCriterionTypeEnum.PERSONAL, [personalSub]),
      )

      expect(scopesOf(model)).not.toContain(
        ScoringValidationScopeEnum.ROLE_ASSIGNMENTS,
      )
    })

    it('checks every role, not only the first', () => {
      const model = validModel()
      model.roles.push({
        id: 'role-2',
        title: 'Deildarstjóri',
        stepAssignments: [],
      })

      const messages = messagesOf(model)
      expect(messages.filter((m) => m.includes('Deildarstjóri'))).toHaveLength(
        4,
      )
      expect(messages.filter((m) => m.includes('Sérfræðingur'))).toHaveLength(0)
    })

    it('says the model has no jobs when it has sub-criteria but no roles', () => {
      const model = validModel()
      model.roles = []

      expect(scopesOf(model)).toContain(ScoringValidationScopeEnum.ROLES)
    })
  })

  // Sub-criterion titles are not unique across criteria, and a model built from
  // the catalog will often repeat one. Without the parent, four reasons read
  // identically and name nothing a caller can act on.
  it('names the parent criterion so duplicate sub-criterion titles stay distinct', () => {
    const model = validModel()
    for (const c of model.criteria) {
      c.subCriteria[0].title = 'Menntun'
    }
    model.roles[0].stepAssignments = []

    const messages = messagesOf(model).filter((m) =>
      m.includes('vantar úthlutun'),
    )

    expect(messages).toHaveLength(4)
    expect(new Set(messages).size).toBe(4)
    expect(messages).toEqual(
      expect.arrayContaining([
        expect.stringContaining('RESPONSIBILITY / Menntun'),
      ]),
    )
  })

  // The pipeline keys on (criterionTitle, subTitle), so a duplicate pair would
  // collapse two rows onto one key. Caught here rather than by the expansion
  // throwing at filing.
  it('refuses two sub-criteria sharing both titles', () => {
    const model = validModel()
    model.criteria[0].subCriteria.push({
      ...model.criteria[0].subCriteria[0],
      id: 'duplicate',
      weight: 0,
    })

    expect(messagesOf(model)).toEqual(
      expect.arrayContaining([expect.stringContaining('einkvæm')]),
    )
  })

  it('allows the same sub-criterion title under two different criteria', () => {
    const model = validModel()
    model.criteria[0].subCriteria[0].title = 'Menntun'
    model.criteria[1].subCriteria[0].title = 'Menntun'

    expect(messagesOf(model)).not.toEqual(
      expect.arrayContaining([expect.stringContaining('einkvæm')]),
    )
  })

  it('caps the reason list so a pathological model cannot flood the response', () => {
    const many = Array.from({ length: 400 }, (_, i) =>
      sub({ id: `s${i}`, weight: 0.25, stepOrders: [] }),
    )
    const model = validModel()
    model.criteria[0].subCriteria = many

    expect(validateScoringModel(model).reasons.length).toBeLessThanOrEqual(200)
  })
})
