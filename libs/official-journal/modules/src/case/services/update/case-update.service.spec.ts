import { Op } from 'sequelize'

import { ResultWrapper } from '@dmr.is/types'

import { CaseUpdateService } from './case-update.service'

const CASE_ID = 'case-1'
const BASE_BODY = { caseId: CASE_ID, applicationId: 'application-1' }

const createService = () => {
  const transaction = {
    commit: jest.fn(),
    rollback: jest.fn(),
  }

  const caseModel = { update: jest.fn().mockResolvedValue([1]) }
  const caseCategoriesModel = {
    destroy: jest.fn().mockResolvedValue(0),
    bulkCreate: jest.fn().mockResolvedValue([]),
  }
  const utilityService = {
    categoryLookup: jest
      .fn()
      .mockImplementation(async (id: string) =>
        id === 'unknown'
          ? ResultWrapper.err({ code: 404, message: 'Category not found' })
          : ResultWrapper.ok({ id }),
      ),
  }
  const applicationService = { updateApplication: jest.fn() }
  const sequelize = { transaction: jest.fn().mockResolvedValue(transaction) }

  const service = new CaseUpdateService(
    {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    } as never,
    utilityService as never,
    applicationService as never,
    {} as never,
    caseModel as never,
    {} as never,
    {} as never,
    caseCategoriesModel as never,
    {} as never,
    sequelize as never,
  )

  return {
    service,
    transaction,
    caseModel,
    caseCategoriesModel,
    utilityService,
    applicationService,
  }
}

describe('CaseUpdateService.updateCase categories', () => {
  it('sets the case categories to exactly the given list, inside the transaction', async () => {
    const { service, transaction, caseCategoriesModel, applicationService } =
      createService()

    const result = await service.updateCase(CASE_ID, {
      ...BASE_BODY,
      categoryIds: ['cat-a', 'cat-b', 'cat-a'],
    })

    expect(result.result.ok).toBe(true)
    expect(caseCategoriesModel.destroy).toHaveBeenCalledWith({
      where: {
        caseId: CASE_ID,
        categoryId: { [Op.notIn]: ['cat-a', 'cat-b'] },
      },
      transaction,
    })
    expect(caseCategoriesModel.bulkCreate).toHaveBeenCalledWith(
      [
        { caseId: CASE_ID, categoryId: 'cat-a' },
        { caseId: CASE_ID, categoryId: 'cat-b' },
      ],
      { ignoreDuplicates: true, transaction },
    )
    // The list came from the application; do not write it back.
    expect(applicationService.updateApplication).not.toHaveBeenCalled()
    // The category writes finish before the transaction commits.
    expect(
      caseCategoriesModel.bulkCreate.mock.invocationCallOrder[0],
    ).toBeLessThan(transaction.commit.mock.invocationCallOrder[0])
  })

  it('fails and rolls back when a category does not exist', async () => {
    const { service, transaction, caseCategoriesModel } = createService()

    const result = await service.updateCase(CASE_ID, {
      ...BASE_BODY,
      categoryIds: ['cat-a', 'unknown'],
    })

    expect(result.result.ok).toBe(false)
    expect(caseCategoriesModel.destroy).not.toHaveBeenCalled()
    expect(caseCategoriesModel.bulkCreate).not.toHaveBeenCalled()
    expect(transaction.rollback).toHaveBeenCalled()
    expect(transaction.commit).not.toHaveBeenCalled()
  })

  it('leaves categories alone when none are given', async () => {
    const { service, caseCategoriesModel, utilityService } = createService()

    await service.updateCase(CASE_ID, {
      ...BASE_BODY,
      advertTitle: 'Titill',
    })

    expect(utilityService.categoryLookup).not.toHaveBeenCalled()
    expect(caseCategoriesModel.destroy).not.toHaveBeenCalled()
    expect(caseCategoriesModel.bulkCreate).not.toHaveBeenCalled()
  })
})
