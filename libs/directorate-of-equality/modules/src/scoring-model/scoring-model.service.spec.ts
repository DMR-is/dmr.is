import { NotFoundException } from '@nestjs/common'
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
import { ScoringSubCriterionModel } from './models/scoring-sub-criterion.model'
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

  beforeEach(async () => {
    modelFindOne = jest.fn().mockResolvedValue(loadedModel())
    modelFindAll = jest.fn().mockResolvedValue([])
    modelCreate = jest.fn()
    criterionFindOne = jest.fn().mockResolvedValue(null)
    criterionCreate = jest.fn()
    subFindOne = jest.fn().mockResolvedValue(null)
    subCreate = jest.fn()

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
