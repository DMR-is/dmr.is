import { NotFoundException } from '@nestjs/common'

import { CompanyDto } from '@dmr.is/doe-modules/company'
import { IScoringModelService } from '@dmr.is/doe-modules/scoring-model'

import { ScoringModelController } from './scoring-model.controller'

const COMPANY = { id: 'company-1' } as CompanyDto
const MODEL_ID = 'model-1'
const CRITERION_ID = 'criterion-1'
const SUB_ID = 'sub-1'
const ROLE_ID = 'role-1'

/**
 * The controller had no spec at all. It is thin — every route delegates — so
 * what is worth pinning is that each one delegates to the *right* method with
 * the caller's own company and the ids from its own path, since a route that
 * quietly passed the wrong id would still look correct in a response.
 */
describe('ScoringModelController', () => {
  let controller: ScoringModelController
  let svc: Record<string, jest.Mock>

  beforeEach(() => {
    svc = Object.fromEntries(
      [
        'createModel',
        'listModels',
        'getModel',
        'deleteModel',
        'createCriterion',
        'updateCriterion',
        'deleteCriterion',
        'createSubCriterion',
        'updateSubCriterion',
        'deleteSubCriterion',
        'setSteps',
        'createRole',
        'updateRole',
        'deleteRole',
        'setRoleStepAssignments',
      ].map((m) => [m, jest.fn().mockResolvedValue({ ok: true })]),
    )

    controller = new ScoringModelController(
      svc as unknown as IScoringModelService,
    )
  })

  it('creates a model for the calling company', async () => {
    await controller.createModel(COMPANY, { name: 'Starfsmat' })

    expect(svc.createModel).toHaveBeenCalledWith(COMPANY, {
      name: 'Starfsmat',
    })
  })

  it('lists only via the company on the key', async () => {
    await controller.listModels(COMPANY)

    expect(svc.listModels).toHaveBeenCalledWith(COMPANY)
  })

  it('reads a model by the id in its own path', async () => {
    await controller.getModel(COMPANY, MODEL_ID)

    expect(svc.getModel).toHaveBeenCalledWith(COMPANY, MODEL_ID)
  })

  it('passes a 404 from the ownership gate straight through', async () => {
    svc.getModel.mockRejectedValue(
      new NotFoundException('Starfsmat fannst ekki'),
    )

    await expect(controller.getModel(COMPANY, MODEL_ID)).rejects.toThrow(
      NotFoundException,
    )
  })

  it('nests a sub-criterion under the criterion named in the path', async () => {
    await controller.createSubCriterion(COMPANY, MODEL_ID, CRITERION_ID, {
      title: 't',
      description: 'd',
      weight: 25,
    })

    expect(svc.createSubCriterion).toHaveBeenCalledWith(
      COMPANY,
      MODEL_ID,
      CRITERION_ID,
      { title: 't', description: 'd', weight: 25 },
    )
  })

  it('passes all three ids through when replacing a scale', async () => {
    const body = { steps: [{ description: 'a' }, { description: 'b' }] }

    await controller.setSteps(COMPANY, MODEL_ID, CRITERION_ID, SUB_ID, body)

    expect(svc.setSteps).toHaveBeenCalledWith(
      COMPANY,
      MODEL_ID,
      CRITERION_ID,
      SUB_ID,
      body,
    )
  })

  it('replaces a job’s assignments against the job in its path', async () => {
    const body = { assignments: [{ subCriterionId: SUB_ID, stepId: 'st-1' }] }

    await controller.setRoleStepAssignments(COMPANY, MODEL_ID, ROLE_ID, body)

    expect(svc.setRoleStepAssignments).toHaveBeenCalledWith(
      COMPANY,
      MODEL_ID,
      ROLE_ID,
      body,
    )
  })

  it('deletes the model named in the path and returns nothing', async () => {
    await expect(
      controller.deleteModel(COMPANY, MODEL_ID),
    ).resolves.toBeUndefined()

    expect(svc.deleteModel).toHaveBeenCalledWith(COMPANY, MODEL_ID)
  })
})
