import { BadRequestException, NotFoundException } from '@nestjs/common'
import { getModelToken } from '@nestjs/sequelize'
import { Test } from '@nestjs/testing'

import { CompanyDto } from '../company/dto/company.dto'
import {
  CompanyReportStatusEnum,
  CompanySizeEnum,
  CompanyStatusEnum,
} from '../company/models/company.enums'
import { ReportCriterionTypeEnum } from '../report-criterion/models/report-criterion.model'
import { ScoringModelStatusEnum } from './dto/scoring-validation.dto'
import { ScoringCriterionModel } from './models/scoring-criterion.model'
import { ScoringModelModel } from './models/scoring-model.model'
import { ScoringRoleModel } from './models/scoring-role.model'
import { ScoringRoleStepModel } from './models/scoring-role-step.model'
import { ScoringSubCriterionModel } from './models/scoring-sub-criterion.model'
import { ScoringSubCriterionStepModel } from './models/scoring-sub-criterion-step.model'
import { ScoringModelService } from './scoring-model.service'

const MODEL_ID = 'model-1'
const CRITERION_ID = 'criterion-1'
const SUB_ID = 'sub-1'

const COMPANY = {
  id: 'company-1',
  nationalId: '5500000000',
  employeeCountCategory: CompanySizeEnum.LARGE,
  status: CompanyStatusEnum.ACTIVE,
  reportStatus: CompanyReportStatusEnum.SATISFACTORY,
} as unknown as CompanyDto

/** A loaded tree, shaped the way the includes hydrate it. */
const loadedModel = (
  overrides: Partial<{
    criteria: unknown[]
    roles: unknown[]
  }> = {},
) =>
  ({
    id: MODEL_ID,
    name: 'Starfsmat',
    criteria: overrides.criteria ?? [],
    roles: overrides.roles ?? [],
    destroy: jest.fn(),
  }) as unknown as ScoringModelModel

describe('ScoringModelService', () => {
  let service: ScoringModelService
  let modelFindOne: jest.Mock
  let modelFindAll: jest.Mock
  let modelCreate: jest.Mock
  let criterionFindOne: jest.Mock
  let criterionCreate: jest.Mock
  let subFindOne: jest.Mock
  let subCreate: jest.Mock
  let stepDestroy: jest.Mock
  let stepBulkCreate: jest.Mock
  let roleFindOne: jest.Mock
  let roleCreate: jest.Mock
  let roleStepDestroy: jest.Mock
  let roleStepBulkCreate: jest.Mock

  beforeEach(async () => {
    modelFindOne = jest.fn().mockResolvedValue(loadedModel())
    modelFindAll = jest.fn().mockResolvedValue([])
    modelCreate = jest.fn()
    criterionFindOne = jest.fn().mockResolvedValue(null)
    criterionCreate = jest.fn()
    subFindOne = jest.fn().mockResolvedValue(null)
    subCreate = jest.fn()
    stepDestroy = jest.fn()
    stepBulkCreate = jest.fn()
    roleFindOne = jest.fn().mockResolvedValue(null)
    roleCreate = jest.fn()
    roleStepDestroy = jest.fn()
    roleStepBulkCreate = jest.fn()

    const module = await Test.createTestingModule({
      providers: [
        ScoringModelService,
        {
          provide: getModelToken(ScoringModelModel),
          useValue: {
            findOne: modelFindOne,
            findAll: modelFindAll,
            create: modelCreate,
          },
        },
        {
          provide: getModelToken(ScoringCriterionModel),
          useValue: { findOne: criterionFindOne, create: criterionCreate },
        },
        {
          provide: getModelToken(ScoringSubCriterionModel),
          useValue: { findOne: subFindOne, create: subCreate },
        },
        {
          provide: getModelToken(ScoringSubCriterionStepModel),
          useValue: { destroy: stepDestroy, bulkCreate: stepBulkCreate },
        },
        {
          provide: getModelToken(ScoringRoleModel),
          useValue: { findOne: roleFindOne, create: roleCreate },
        },
        {
          provide: getModelToken(ScoringRoleStepModel),
          useValue: {
            destroy: roleStepDestroy,
            bulkCreate: roleStepBulkCreate,
          },
        },
      ],
    }).compile()

    service = module.get(ScoringModelService)
  })

  describe('ownership', () => {
    // Scoped by companyId in the query rather than checked afterwards, so a
    // model belonging to another company is indistinguishable from one that
    // does not exist — an id alone gets a caller nowhere.
    it('scopes the lookup by company rather than filtering after the fact', async () => {
      await service.getModel(COMPANY, MODEL_ID)

      expect(modelFindOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: MODEL_ID, companyId: COMPANY.id },
        }),
      )
    })

    it('404s for a model this company does not own', async () => {
      modelFindOne.mockResolvedValue(null)

      await expect(service.getModel(COMPANY, MODEL_ID)).rejects.toThrow(
        NotFoundException,
      )
    })

    it('refuses a criterion that belongs to another model', async () => {
      criterionFindOne.mockResolvedValue(null)

      await expect(
        service.deleteCriterion(COMPANY, MODEL_ID, CRITERION_ID),
      ).rejects.toThrow(NotFoundException)

      expect(criterionFindOne).toHaveBeenCalledWith({
        where: { id: CRITERION_ID, scoringModelId: MODEL_ID },
      })
    })

    it('refuses a sub-criterion that belongs to another criterion', async () => {
      criterionFindOne.mockResolvedValue({ id: CRITERION_ID })
      subFindOne.mockResolvedValue(null)

      await expect(
        service.deleteSubCriterion(COMPANY, MODEL_ID, CRITERION_ID, SUB_ID),
      ).rejects.toThrow(NotFoundException)

      expect(subFindOne).toHaveBeenCalledWith({
        where: { id: SUB_ID, scoringCriterionId: CRITERION_ID },
      })
    })
  })

  describe('derived criterion weight', () => {
    it('is the sum of its own sub-criteria, never a stored column', async () => {
      modelFindOne.mockResolvedValue(
        loadedModel({
          criteria: [
            {
              id: CRITERION_ID,
              type: ReportCriterionTypeEnum.RESPONSIBILITY,
              title: 'Ábyrgð',
              description: 'd',
              subCriteria: [
                { id: 'a', title: 'a', description: 'd', weight: 30, steps: [] },
                { id: 'b', title: 'b', description: 'd', weight: 12.5, steps: [] },
              ],
            },
          ],
        }),
      )

      const result = await service.getModel(COMPANY, MODEL_ID)

      expect(result.criteria[0].weight).toBe(42.5)
    })

    it('is zero for a criterion with no sub-criteria', async () => {
      modelFindOne.mockResolvedValue(
        loadedModel({
          criteria: [
            {
              id: CRITERION_ID,
              type: ReportCriterionTypeEnum.COMPETENCE,
              title: 'Hæfni',
              description: 'd',
              subCriteria: [],
            },
          ],
        }),
      )

      const result = await service.getModel(COMPANY, MODEL_ID)

      expect(result.criteria[0].weight).toBe(0)
    })
  })

  it('orders a sub-criterion’s steps by their own stepOrder', async () => {
    modelFindOne.mockResolvedValue(
      loadedModel({
        criteria: [
          {
            id: CRITERION_ID,
            type: ReportCriterionTypeEnum.STRAIN,
            title: 'Álag',
            description: 'd',
            subCriteria: [
              {
                id: SUB_ID,
                title: 's',
                description: 'd',
                weight: 10,
                steps: [
                  { id: 's3', stepOrder: 3, description: 'c' },
                  { id: 's1', stepOrder: 1, description: 'a' },
                  { id: 's2', stepOrder: 2, description: 'b' },
                ],
              },
            ],
          },
        ],
      }),
    )

    const result = await service.getModel(COMPANY, MODEL_ID)

    expect(
      result.criteria[0].subCriteria[0].steps.map((s) => s.stepOrder),
    ).toEqual([1, 2, 3])
  })

  describe('writes that leave the model incomplete', () => {
    // The whole contract: authoring happens over many calls, so a write that
    // leaves the model unfit to file still succeeds and reports where it stands.
    it('creates a criterion and answers with the model’s validity', async () => {
      const result = await service.createCriterion(COMPANY, MODEL_ID, {
        type: ReportCriterionTypeEnum.RESPONSIBILITY,
        title: 'Ábyrgð',
        description: 'd',
      })

      expect(criterionCreate).toHaveBeenCalledWith({
        scoringModelId: MODEL_ID,
        type: ReportCriterionTypeEnum.RESPONSIBILITY,
        title: 'Ábyrgð',
        description: 'd',
      })
      expect(result.validation.status).toBe(ScoringModelStatusEnum.INVALID)
      expect(result.validation.reasons.length).toBeGreaterThan(0)
    })

    it('deletes a mandatory criterion rather than refusing the call', async () => {
      const destroy = jest.fn()
      criterionFindOne.mockResolvedValue({ id: CRITERION_ID, destroy })

      const result = await service.deleteCriterion(
        COMPANY,
        MODEL_ID,
        CRITERION_ID,
      )

      expect(destroy).toHaveBeenCalled()
      expect(result.validation.status).toBe(ScoringModelStatusEnum.INVALID)
    })
  })

  describe('PATCH semantics', () => {
    it('leaves omitted keys alone rather than clearing them', async () => {
      const update = jest.fn()
      criterionFindOne.mockResolvedValue({ id: CRITERION_ID, update })

      await service.updateCriterion(COMPANY, MODEL_ID, CRITERION_ID, {
        title: 'Nýtt heiti',
      })

      expect(update).toHaveBeenCalledWith({ title: 'Nýtt heiti' })
    })

    it('passes a sub-criterion’s weight through on its own', async () => {
      const update = jest.fn()
      criterionFindOne.mockResolvedValue({ id: CRITERION_ID })
      subFindOne.mockResolvedValue({ id: SUB_ID, update })

      await service.updateSubCriterion(
        COMPANY,
        MODEL_ID,
        CRITERION_ID,
        SUB_ID,
        { weight: 30 },
      )

      expect(update).toHaveBeenCalledWith({ weight: 30 })
    })

    it('applies every key that was given', async () => {
      const update = jest.fn()
      criterionFindOne.mockResolvedValue({ id: CRITERION_ID })
      subFindOne.mockResolvedValue({ id: SUB_ID, update })

      await service.updateSubCriterion(
        COMPANY,
        MODEL_ID,
        CRITERION_ID,
        SUB_ID,
        { title: 't', description: 'd', weight: 5 },
      )

      expect(update).toHaveBeenCalledWith({
        title: 't',
        description: 'd',
        weight: 5,
      })
    })
  })

  describe('setSteps', () => {
    beforeEach(() => {
      criterionFindOne.mockResolvedValue({ id: CRITERION_ID })
      subFindOne.mockResolvedValue({ id: SUB_ID })
    })

    // Position is the þrep number. Deriving it from the array is what makes a
    // gap impossible rather than something the validator has to catch.
    it('numbers the steps from their position, not from the caller', async () => {
      await service.setSteps(COMPANY, MODEL_ID, CRITERION_ID, SUB_ID, {
        steps: [
          { description: 'lægst' },
          { description: 'mið' },
          { description: 'hæst' },
        ],
      })

      expect(stepBulkCreate).toHaveBeenCalledWith([
        { scoringSubCriterionId: SUB_ID, stepOrder: 1, description: 'lægst' },
        { scoringSubCriterionId: SUB_ID, stepOrder: 2, description: 'mið' },
        { scoringSubCriterionId: SUB_ID, stepOrder: 3, description: 'hæst' },
      ])
    })

    it('clears the old scale before writing the new one', async () => {
      await service.setSteps(COMPANY, MODEL_ID, CRITERION_ID, SUB_ID, {
        steps: [{ description: 'a' }, { description: 'b' }],
      })

      expect(stepDestroy).toHaveBeenCalledWith({
        where: { scoringSubCriterionId: SUB_ID },
      })
      expect(stepDestroy.mock.invocationCallOrder[0]).toBeLessThan(
        stepBulkCreate.mock.invocationCallOrder[0],
      )
    })

    it('refuses a sub-criterion outside the named criterion', async () => {
      subFindOne.mockResolvedValue(null)

      await expect(
        service.setSteps(COMPANY, MODEL_ID, CRITERION_ID, SUB_ID, {
          steps: [{ description: 'a' }],
        }),
      ).rejects.toThrow(NotFoundException)

      expect(stepDestroy).not.toHaveBeenCalled()
    })
  })

  describe('setRoleStepAssignments', () => {
    const ROLE_ID = 'role-1'
    const JOB_SUB = 'job-sub'
    const JOB_STEP = 'job-step'
    const PERSONAL_SUB = 'personal-sub'
    const PERSONAL_STEP = 'personal-step'

    const treeWithBothKinds = () =>
      loadedModel({
        criteria: [
          {
            id: CRITERION_ID,
            type: ReportCriterionTypeEnum.RESPONSIBILITY,
            title: 'Ábyrgð',
            description: 'd',
            subCriteria: [
              {
                id: JOB_SUB,
                title: 'Mannaforráð',
                description: 'd',
                weight: 100,
                steps: [{ id: JOB_STEP, stepOrder: 1, description: 'a' }],
              },
            ],
          },
          {
            id: 'personal-criterion',
            type: ReportCriterionTypeEnum.PERSONAL,
            title: 'Frammistaða',
            description: 'd',
            subCriteria: [
              {
                id: PERSONAL_SUB,
                title: 'Menntun',
                description: 'd',
                weight: 0,
                steps: [{ id: PERSONAL_STEP, stepOrder: 1, description: 'a' }],
              },
            ],
          },
        ],
      })

    beforeEach(() => {
      modelFindOne.mockResolvedValue(treeWithBothKinds())
      roleFindOne.mockResolvedValue({ id: ROLE_ID })
    })

    it('replaces the whole set rather than merging into it', async () => {
      await service.setRoleStepAssignments(COMPANY, MODEL_ID, ROLE_ID, {
        assignments: [{ subCriterionId: JOB_SUB, stepId: JOB_STEP }],
      })

      expect(roleStepDestroy).toHaveBeenCalledWith({
        where: { scoringRoleId: ROLE_ID },
      })
      expect(roleStepBulkCreate).toHaveBeenCalledWith([
        {
          scoringRoleId: ROLE_ID,
          scoringSubCriterionId: JOB_SUB,
          scoringSubCriterionStepId: JOB_STEP,
        },
      ])
    })

    // Incomplete is reported by the validator; only incoherent is refused.
    it('accepts a set that does not cover every sub-criterion', async () => {
      const result = await service.setRoleStepAssignments(
        COMPANY,
        MODEL_ID,
        ROLE_ID,
        { assignments: [] },
      )

      expect(roleStepDestroy).toHaveBeenCalled()
      expect(roleStepBulkCreate).not.toHaveBeenCalled()
      expect(result.validation.status).toBe(ScoringModelStatusEnum.INVALID)
    })

    it('refuses a step belonging to a different sub-criterion', async () => {
      await expect(
        service.setRoleStepAssignments(COMPANY, MODEL_ID, ROLE_ID, {
          assignments: [
            { subCriterionId: JOB_SUB, stepId: PERSONAL_STEP },
          ],
        }),
      ).rejects.toThrow(BadRequestException)

      expect(roleStepDestroy).not.toHaveBeenCalled()
    })

    it('refuses a sub-criterion outside this model', async () => {
      await expect(
        service.setRoleStepAssignments(COMPANY, MODEL_ID, ROLE_ID, {
          assignments: [{ subCriterionId: 'elsewhere', stepId: JOB_STEP }],
        }),
      ).rejects.toThrow(BadRequestException)
    })

    it('refuses a personal sub-criterion, which is scored per employee', async () => {
      await expect(
        service.setRoleStepAssignments(COMPANY, MODEL_ID, ROLE_ID, {
          assignments: [
            { subCriterionId: PERSONAL_SUB, stepId: PERSONAL_STEP },
          ],
        }),
      ).rejects.toThrow(BadRequestException)
    })

    it('refuses the same sub-criterion twice', async () => {
      await expect(
        service.setRoleStepAssignments(COMPANY, MODEL_ID, ROLE_ID, {
          assignments: [
            { subCriterionId: JOB_SUB, stepId: JOB_STEP },
            { subCriterionId: JOB_SUB, stepId: JOB_STEP },
          ],
        }),
      ).rejects.toThrow(BadRequestException)

      expect(roleStepDestroy).not.toHaveBeenCalled()
    })

    it('refuses a role belonging to another model', async () => {
      roleFindOne.mockResolvedValue(null)

      await expect(
        service.setRoleStepAssignments(COMPANY, MODEL_ID, ROLE_ID, {
          assignments: [],
        }),
      ).rejects.toThrow(NotFoundException)
    })
  })

  // `expandToParsedPayload` is the only code enforcing company ownership before
  // a filing or a preview, and nothing tested it: this spec never referenced it,
  // `partner-submission.service.spec.ts` mocks it away, and the pure-lib spec
  // hand-builds a model and so never crosses the gate. A live check is not a
  // regression test.
  // Pinned on the query itself. The previous ordering assertions matched with
  // `objectContaining({ where })` and the þrep test passed through `toDto`'s
  // in-memory sort, so both `order` clauses could be deleted with every test
  // still green — which is how a fix claimed in a PR body stays unproven.
  describe('the tree is fetched in a stable order', () => {
    const includeFor = (as: string) => {
      const call = modelFindOne.mock.calls[0][0]
      const find = (nodes: unknown[]): Record<string, unknown> | undefined => {
        for (const node of nodes as Record<string, unknown>[]) {
          if (node.as === as) return node
          const nested = node.include as unknown[] | undefined
          if (nested) {
            const hit = find(nested)
            if (hit) return hit
          }
        }
        return undefined
      }
      return find(call.include as unknown[])
    }

    // Every collection is fetched separately, so nothing joins to anything and
    // no branch multiplies another. A top-level `order` cannot reach a
    // separately-fetched include, so each carries its own — with `id` as the
    // tiebreak, because a `bulkCreate` stamps one `createdAt` across the set
    // and ordering on it alone would be an all-ties sort.
    it.each(['criteria', 'roles', 'subCriteria', 'stepAssignments'])(
      'fetches %s separately, ordered deterministically',
      async (as) => {
        await service.getModel(COMPANY, MODEL_ID)

        expect(includeFor(as)).toMatchObject({
          separate: true,
          order: [
            ['createdAt', 'ASC'],
            ['id', 'ASC'],
          ],
        })
      },
    )
  })

  describe('expandToParsedPayload — the ownership gate before filing', () => {
    it('resolves the model scoped to the calling company', async () => {
      await service.expandToParsedPayload(COMPANY, MODEL_ID, [])

      expect(modelFindOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: MODEL_ID, companyId: COMPANY.id },
        }),
      )
    })

    it('404s for a model this company does not own, before expanding anything', async () => {
      modelFindOne.mockResolvedValue(null)

      await expect(
        service.expandToParsedPayload(COMPANY, MODEL_ID, []),
      ).rejects.toThrow(NotFoundException)
    })

    it('expands the tree it loaded', async () => {
      modelFindOne.mockResolvedValue(
        loadedModel({
          criteria: [
            {
              id: CRITERION_ID,
              type: ReportCriterionTypeEnum.RESPONSIBILITY,
              title: 'Ábyrgð',
              description: 'd',
              subCriteria: [
                {
                  id: SUB_ID,
                  title: 'Mannaforráð',
                  description: 'd',
                  weight: 100,
                  steps: [{ id: 'st-1', stepOrder: 1, description: 'a' }],
                },
              ],
            },
          ],
        }),
      )

      const parsed = await service.expandToParsedPayload(COMPANY, MODEL_ID, [])

      expect(parsed.criteria[0].title).toBe('Ábyrgð')
      expect(parsed.criteria[0].subCriteria[0].steps[0].score).toBe(1000)
    })
  })

  it('lists only this company’s models', async () => {
    modelFindAll.mockResolvedValue([{ id: MODEL_ID, name: 'Starfsmat' }])

    const result = await service.listModels(COMPANY)

    expect(modelFindAll).toHaveBeenCalledWith(
      expect.objectContaining({ where: { companyId: COMPANY.id } }),
    )
    expect(result.models).toEqual([{ id: MODEL_ID, name: 'Starfsmat' }])
  })

  it('stamps the authenticated company onto a created model', async () => {
    modelCreate.mockResolvedValue({ id: MODEL_ID, name: 'Starfsmat' })

    await service.createModel(COMPANY, { name: 'Starfsmat' })

    expect(modelCreate).toHaveBeenCalledWith({
      companyId: COMPANY.id,
      name: 'Starfsmat',
    })
  })
})
