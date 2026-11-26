import { Sequelize } from 'sequelize-typescript'

import { getModelToken } from '@nestjs/sequelize'
import { Test } from '@nestjs/testing'

import { LOGGER_PROVIDER } from '@dmr.is/logging'
import { IAWSService } from '@dmr.is/shared-modules'
import { ResultWrapper } from '@dmr.is/types'

import { AdditionalPartiesService } from '../additional-parties'
import { IAttachmentService } from '../attachments/attachment.service.interface'
import { IAuthService } from '../auth/auth.service.interface'
import { ICaseService } from '../case/case.service.interface'
import { ICommentServiceV2 } from '../comment/v2'
import { AdvertModel } from '../journal/models'
import { IPriceService } from '../price/price.service.interface'
import { ISignatureService } from '../signature/signature.service.interface'
import { IUtilityService } from '../utility/utility.service.interface'
import { ApplicationService } from './application.service'

const APPLICATION_ID = '6f1c1a3e-2b4d-4c5e-9f60-7a8b9c0d1e2f'
const CASE_ID = 'case-1'
const APPLICATION = {
  id: APPLICATION_ID,
  answers: { advert: { title: 'Titill' } },
} as never
const CALLER = { nationalId: '0101010000', involvedPartyIds: ['party-1'] }

const islandIsResponse = (status: number, body: unknown = {}) => ({
  ok: status >= 200 && status < 300,
  status,
  statusText: '',
  headers: { get: () => null },
  json: async () => body,
  text: async () => JSON.stringify(body),
})

const setup = async () => {
  const ownTransaction = { commit: jest.fn(), rollback: jest.fn() }

  const utilityService = {
    caseLookupByApplicationId: jest.fn().mockResolvedValue(
      ResultWrapper.ok({
        id: CASE_ID,
        advertId: null,
        involvedParty: { id: 'party-1' },
      }),
    ),
    caseCommunicationStatusLookup: jest
      .fn()
      .mockResolvedValue(ResultWrapper.ok({ id: 'status-1' })),
  }
  const caseService = {
    createCaseByApplication: jest.fn().mockResolvedValue(ResultWrapper.ok()),
    updateCase: jest.fn().mockResolvedValue(ResultWrapper.ok()),
    updateCaseCommunicationStatus: jest
      .fn()
      .mockResolvedValue(ResultWrapper.ok()),
    createCaseHistory: jest.fn().mockResolvedValue(ResultWrapper.ok()),
  }
  const commentService = {
    createSubmitComment: jest.fn().mockResolvedValue(ResultWrapper.ok()),
  }
  const authService = {
    xroadFetch: jest
      .fn()
      .mockResolvedValue(
        islandIsResponse(200, { answers: { advert: { title: 'Titill' } } }),
      ),
  }
  const additionalPartiesService = {
    syncCaseAdditionalParties: jest.fn().mockResolvedValue(undefined),
  }

  const priceService = {
    getFeeForApplication: jest
      .fn()
      .mockResolvedValue(ResultWrapper.ok({ price: 1 })),
  }

  const app = await Test.createTestingModule({
    providers: [
      ApplicationService,
      {
        provide: LOGGER_PROVIDER,
        useValue: {
          debug: jest.fn(),
          info: jest.fn(),
          warn: jest.fn(),
          error: jest.fn(),
        },
      },
      { provide: IAttachmentService, useValue: {} },
      { provide: IUtilityService, useValue: utilityService },
      { provide: ICommentServiceV2, useValue: commentService },
      { provide: ICaseService, useValue: caseService },
      { provide: IAuthService, useValue: authService },
      { provide: ISignatureService, useValue: {} },
      { provide: IPriceService, useValue: priceService },
      { provide: IAWSService, useValue: {} },
      { provide: AdditionalPartiesService, useValue: additionalPartiesService },
      { provide: getModelToken(AdvertModel), useValue: {} },
      {
        provide: Sequelize,
        useValue: { transaction: jest.fn().mockResolvedValue(ownTransaction) },
      },
    ],
  }).compile()

  return {
    service: app.get(ApplicationService),
    ownTransaction,
    utilityService,
    caseService,
    authService,
    priceService,
  }
}

describe('ApplicationService.postApplication', () => {
  const originalPath = process.env.XROAD_ISLAND_IS_PATH

  beforeAll(() => {
    process.env.XROAD_ISLAND_IS_PATH = 'https://xroad.test/r1/IS/GOV/island-is'
  })

  afterAll(() => {
    process.env.XROAD_ISLAND_IS_PATH = originalPath
  })

  it('creates a case when the application has none yet', async () => {
    const { service, utilityService, caseService } = await setup()
    utilityService.caseLookupByApplicationId.mockResolvedValue(
      ResultWrapper.err({ code: 404, message: 'Case not found' }),
    )

    await service.postApplication(APPLICATION, CALLER)

    expect(caseService.createCaseByApplication).toHaveBeenCalledWith(
      APPLICATION,
      CALLER,
    )
    expect(caseService.updateCase).not.toHaveBeenCalled()
  })

  it('updates the existing case and commits on a re-post', async () => {
    const { service, ownTransaction, caseService } = await setup()

    const result = await service.postApplication(APPLICATION, CALLER)

    expect(result.result.ok).toBe(true)
    expect(caseService.updateCase).toHaveBeenCalled()
    expect(caseService.createCaseByApplication).not.toHaveBeenCalled()
    expect(ownTransaction.commit).toHaveBeenCalled()
  })

  it('uses the application it was given instead of reading it again', async () => {
    const { service, authService } = await setup()

    await service.postApplication(APPLICATION, CALLER)

    expect(authService.xroadFetch).not.toHaveBeenCalled()
  })

  it('does not create a duplicate case when a later step returns a 404', async () => {
    const { service, ownTransaction, caseService } = await setup()
    caseService.updateCase.mockResolvedValue(
      ResultWrapper.err({ code: 404, message: 'Case not found' }),
    )

    const result = await service.postApplication(APPLICATION, CALLER)

    expect(result.result.ok).toBe(false)
    expect(caseService.createCaseByApplication).not.toHaveBeenCalled()
    expect(ownTransaction.rollback).toHaveBeenCalled()
    expect(ownTransaction.commit).not.toHaveBeenCalled()
  })

  it('rolls back instead of committing half a re-post when the case update fails', async () => {
    const { service, ownTransaction, caseService } = await setup()
    caseService.updateCase.mockResolvedValue(
      ResultWrapper.err({ code: 400, message: 'Bad update' }),
    )

    const result = await service.postApplication(APPLICATION, CALLER)

    expect(result.result.ok).toBe(false)
    expect(caseService.createCaseByApplication).not.toHaveBeenCalled()
    expect(caseService.createCaseHistory).not.toHaveBeenCalled()
    expect(ownTransaction.rollback).toHaveBeenCalled()
    expect(ownTransaction.commit).not.toHaveBeenCalled()
  })
})

describe('ApplicationService.getPrice', () => {
  it('prices the application it is given, without fetching it again', async () => {
    const { service, authService, priceService } = await setup()

    const result = await service.getPrice(APPLICATION)

    expect(priceService.getFeeForApplication).toHaveBeenCalledWith(APPLICATION)
    expect(authService.xroadFetch).not.toHaveBeenCalled()
    expect(result.result.ok).toBe(true)
  })
})
