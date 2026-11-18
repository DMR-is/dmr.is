import { Op, Transaction } from 'sequelize'
import { Sequelize } from 'sequelize-typescript'

import { getModelToken } from '@nestjs/sequelize'
import { Test } from '@nestjs/testing'

import { LOGGER_PROVIDER } from '@dmr.is/logging'
import { ResultWrapper } from '@dmr.is/types'

import { IApplicationService } from '../../../application/application.service.interface'
import { ICommentServiceV2 } from '../../../comment/v2'
import { IPriceService } from '../../../price/price.service.interface'
import { IUtilityService } from '../../../utility/utility.service.interface'
import {
  CaseAdditionModel,
  CaseAdditionsModel,
  CaseCategoriesModel,
  CaseModel,
} from '../../models'
import { CaseUpdateService } from './case-update.service'

const CASE_ID = 'case-1'
const BASE_BODY = { caseId: CASE_ID, applicationId: 'application-1' }
const KNOWN_CATEGORIES = ['cat-a', 'cat-b']

const setup = async () => {
  const ownTransaction = { commit: jest.fn(), rollback: jest.fn() }

  const caseModel = {
    update: jest.fn().mockResolvedValue([1]),
    findByPk: jest.fn(),
  }
  const caseCategoriesModel = {
    destroy: jest.fn().mockResolvedValue(0),
    bulkCreate: jest.fn().mockResolvedValue([]),
    findAll: jest.fn(),
  }
  const utilityService = {
    categoriesLookup: jest.fn().mockImplementation(async (ids: string[]) =>
      ResultWrapper.ok(
        ids
          .filter((id) => KNOWN_CATEGORIES.includes(id))
          .map((id) => ({
            id,
            title: `Title ${id}`,
            slug: `slug-${id}`,
            createdAt: new Date(),
          })),
      ),
    ),
    categoryLookup: jest
      .fn()
      .mockImplementation(async (id: string) => ResultWrapper.ok({ id })),
  }
  const applicationService = { updateApplication: jest.fn() }
  const sequelize = {
    transaction: jest.fn().mockResolvedValue(ownTransaction),
  }

  const logger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }

  const app = await Test.createTestingModule({
    providers: [
      CaseUpdateService,
      { provide: LOGGER_PROVIDER, useValue: logger },
      { provide: IUtilityService, useValue: utilityService },
      { provide: IApplicationService, useValue: applicationService },
      { provide: ICommentServiceV2, useValue: {} },
      { provide: IPriceService, useValue: {} },
      { provide: getModelToken(CaseModel), useValue: caseModel },
      { provide: getModelToken(CaseAdditionModel), useValue: {} },
      { provide: getModelToken(CaseAdditionsModel), useValue: {} },
      {
        provide: getModelToken(CaseCategoriesModel),
        useValue: caseCategoriesModel,
      },
      { provide: Sequelize, useValue: sequelize },
    ],
  }).compile()

  return {
    service: app.get(CaseUpdateService),
    logger,
    ownTransaction,
    caseModel,
    caseCategoriesModel,
    utilityService,
    applicationService,
  }
}

// Passes `instanceof Transaction`, like the transaction postApplication
// hands to updateCase on a re-post.
const outerTransaction = () =>
  Object.create(Transaction.prototype) as Transaction

describe('CaseUpdateService.updateCase categories', () => {
  it('sets the case categories to exactly the given list, inside the transaction', async () => {
    const { service, ownTransaction, caseCategoriesModel, applicationService } =
      await setup()

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
      transaction: ownTransaction,
    })
    expect(caseCategoriesModel.bulkCreate).toHaveBeenCalledWith(
      [
        { caseId: CASE_ID, categoryId: 'cat-a' },
        { caseId: CASE_ID, categoryId: 'cat-b' },
      ],
      { ignoreDuplicates: true, transaction: ownTransaction },
    )
    // The list came from the application; do not write it back.
    expect(applicationService.updateApplication).not.toHaveBeenCalled()
    // The category writes finish before the transaction commits.
    expect(
      caseCategoriesModel.bulkCreate.mock.invocationCallOrder[0],
    ).toBeLessThan(ownTransaction.commit.mock.invocationCallOrder[0])
  })

  it('keeps the case categories and succeeds when the application lists an unknown category', async () => {
    // A merged or deleted category leaves a stale id in the application.
    // Failing would block every re-post; applying the rest would drop the
    // merge target the case already has.
    const { service, logger, caseCategoriesModel } = await setup()

    const result = await service.updateCase(
      CASE_ID,
      { ...BASE_BODY, categoryIds: ['cat-a', 'merged-away'] },
      outerTransaction(),
    )

    expect(result.result.ok).toBe(true)
    expect(caseCategoriesModel.destroy).not.toHaveBeenCalled()
    expect(caseCategoriesModel.bulkCreate).not.toHaveBeenCalled()
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('unknown categories'),
      expect.objectContaining({ unknownIds: ['merged-away'] }),
    )
  })

  it('writes inside the caller transaction when one is passed', async () => {
    const { service, caseCategoriesModel } = await setup()
    const transaction = outerTransaction()

    await service.updateCase(
      CASE_ID,
      { ...BASE_BODY, categoryIds: ['cat-a'] },
      transaction,
    )

    expect(caseCategoriesModel.destroy).toHaveBeenCalledWith(
      expect.objectContaining({ transaction }),
    )
    expect(caseCategoriesModel.bulkCreate).toHaveBeenCalledWith(
      expect.any(Array),
      { ignoreDuplicates: true, transaction },
    )
  })

  it('leaves categories alone when none are given', async () => {
    const { service, caseCategoriesModel, utilityService } = await setup()

    await service.updateCase(CASE_ID, {
      ...BASE_BODY,
      advertTitle: 'Titill',
    })

    expect(utilityService.categoriesLookup).not.toHaveBeenCalled()
    expect(caseCategoriesModel.destroy).not.toHaveBeenCalled()
    expect(caseCategoriesModel.bulkCreate).not.toHaveBeenCalled()
  })
})

describe('CaseUpdateService.updateCaseCategories write-back', () => {
  it('writes the categories back to the application as entities, not ids', async () => {
    // island.is validates answers against the template, which stores
    // categories as { id, title, slug }; a list of bare ids is rejected.
    const { service, caseModel, caseCategoriesModel, applicationService } =
      await setup()
    caseModel.findByPk.mockResolvedValue({
      id: CASE_ID,
      applicationId: 'application-1',
    })
    caseCategoriesModel.findAll
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { caseId: CASE_ID, categoryId: 'cat-a' },
        { caseId: CASE_ID, categoryId: 'cat-b' },
      ])
    applicationService.updateApplication.mockResolvedValue(ResultWrapper.ok())

    await service.updateCaseCategories(CASE_ID, { categoryIds: ['cat-b'] })

    expect(applicationService.updateApplication).toHaveBeenCalledWith(
      'application-1',
      {
        answers: {
          advert: {
            categories: [
              { id: 'cat-a', title: 'Title cat-a', slug: 'slug-cat-a' },
              { id: 'cat-b', title: 'Title cat-b', slug: 'slug-cat-b' },
            ],
          },
        },
      },
    )
  })
})
