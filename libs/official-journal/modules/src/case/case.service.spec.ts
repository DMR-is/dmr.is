/* eslint-disable unused-imports/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Sequelize } from 'sequelize-typescript'

import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { getModelToken } from '@nestjs/sequelize'
import { Test } from '@nestjs/testing'

import { LOGGER_PROVIDER, LoggingModule } from '@dmr.is/logging'
import { CaseStatusEnum, PostApplicationBody } from '@dmr.is/shared-dto'
import { IAWSService } from '@dmr.is/shared-modules'
import { ResultWrapper } from '@dmr.is/types'

import { AdditionalPartiesService } from '../additional-parties'
import { AdvertMainTypeModel } from '../advert-type/models'
import { IApplicationService } from '../application/application.service.interface'
import { IAttachmentService } from '../attachments/attachment.service.interface'
import { ICommentServiceV2 } from '../comment/v2'
import { IExternalService } from '../external/external.service.interface'
import { IJournalService } from '../journal'
import {
  AdvertCategoryModel,
  AdvertCorrectionModel,
  AdvertDepartmentModel,
  AdvertModel,
} from '../journal/models'
import { IPdfService } from '../pdf/pdf.service.interface'
import { IPriceService } from '../price/price.service.interface'
import { IRegulationPublishService } from '../regulation-publish/regulation-publish.service.interface'
import { IRegulationsAdminService } from '../regulations-admin/regulations-admin.service.interface'
import { IReindexRunnerService } from '../search'
import { ISignatureService } from '../signature/signature.service.interface'
import { IUtilityService } from '../utility/utility.service.interface'
import { CaseCategoriesModel } from './models/case-categories.model'
import { ICaseCreateService } from './services/create/case-create.service.interface'
import { ICaseUpdateService } from './services/update/case-update.service.interface'
import { CaseService } from './case.service'
import { ICaseService } from './case.service.interface'
import {
  CaseAdditionsModel,
  CaseChannelModel,
  CaseChannelsModel,
  CaseCommunicationStatusModel,
  CaseHistoryModel,
  CaseModel,
  CasePublishedAdvertsModel,
  CaseStatusModel,
  CaseTagModel,
} from './models'
describe('CaseService', () => {
  let caseService: ICaseService
  let commentService: ICommentServiceV2
  let applicationService: IApplicationService
  let journalService: IJournalService
  let signatureService: ISignatureService
  let attachmentService: IAttachmentService
  let externalService: IExternalService
  let s3Service: IAWSService
  let caseModel: CaseModel
  let caseHistoryModel: CaseHistoryModel
  let advertModel: AdvertModel
  let advertMainTypeModel: AdvertMainTypeModel
  let categoriesModel: CaseCategoriesModel
  let advertCategoryModel: AdvertCategoryModel
  let caseCategoriesModel: CaseCategoriesModel
  let caseChannelModel: CaseChannelModel
  let caseChannelsModel: CaseChannelsModel
  let caseCreateService: ICaseCreateService
  let caseUpdateService: ICaseUpdateService
  let priceService: IPriceService
  let pdfService: IPdfService
  let sequelize: Sequelize
  let runner: IReindexRunnerService
  let utilityService: IUtilityService
  let casePublishedAdvertsModel: typeof CasePublishedAdvertsModel
  beforeAll(async () => {
    const app = await Test.createTestingModule({
      imports: [LoggingModule],
      providers: [
        {
          provide: ICaseService,
          useClass: CaseService,
        },
        {
          provide: ICommentServiceV2,
          useClass: jest.fn(() => ({
            create: () => ({}),
          })),
        },
        {
          provide: IApplicationService,
          useClass: jest.fn(() => ({
            getApplication: () => ({}),
          })),
        },
        {
          provide: ISignatureService,
          useClass: jest.fn(() => ({})),
        },
        {
          provide: IReindexRunnerService,
          useClass: jest.fn(() => ({
            updateItemInIndex: jest.fn(),
          })),
        },
        {
          provide: IRegulationsAdminService,
          useClass: jest.fn(() => ({})),
        },
        {
          provide: IRegulationPublishService,
          useClass: jest.fn(() => ({})),
        },
        {
          provide: IUtilityService,
          useClass: jest.fn(() => ({})),
        },
        {
          provide: IJournalService,
          useClass: jest.fn(() => ({
            updateAdvert: jest.fn(),
          })),
        },
        {
          provide: IAttachmentService,
          useClass: jest.fn(() => ({})),
        },
        { provide: IExternalService, useClass: jest.fn(() => ({})) },
        {
          provide: IAWSService,
          useClass: jest.fn(() => ({})),
        },
        {
          provide: ICaseCreateService,
          useClass: jest.fn(() => ({})),
        },
        {
          provide: ICaseUpdateService,
          useClass: jest.fn(() => ({})),
        },
        {
          provide: IPdfService,
          useClass: jest.fn(() => ({})),
        },
        {
          provide: IPriceService,
          useClass: jest.fn(() => ({})),
        },
        {
          provide: AdditionalPartiesService,
          useClass: jest.fn(() => ({
            linkCasePartiesToAdvert: jest.fn(),
          })),
        },
        {
          provide: getModelToken(CaseModel),
          useClass: jest.fn(() => ({
            create: () => ({}),
            findOne: () => ({}),
            findByPk: jest.fn(),
            count: () => ({}),
          })),
        },
        {
          provide: getModelToken(CaseCategoriesModel),
          useClass: jest.fn(() => ({})),
        },
        {
          provide: getModelToken(AdvertCategoryModel),
          useClass: jest.fn(() => ({})),
        },
        {
          provide: getModelToken(CaseStatusModel),
          useClass: jest.fn(() => ({
            create: () => ({}),
          })),
        },
        {
          provide: getModelToken(AdvertModel),
          useClass: jest.fn(() => ({
            create: () => ({}),
          })),
        },
        {
          provide: getModelToken(CaseTagModel),
          useClass: jest.fn(() => ({
            create: () => ({}),
          })),
        },
        {
          provide: getModelToken(CaseCommunicationStatusModel),
          useClass: jest.fn(() => ({
            create: () => ({}),
          })),
        },
        {
          provide: getModelToken(AdvertDepartmentModel),
          useClass: jest.fn(() => ({
            create: () => ({}),
          })),
        },
        {
          provide: getModelToken(CaseChannelModel),
          useClass: jest.fn(() => ({})),
        },
        {
          provide: getModelToken(CaseChannelsModel),
          useClass: jest.fn(() => ({})),
        },
        {
          provide: getModelToken(CaseTagModel),
          useClass: jest.fn(() => ({})),
        },
        {
          provide: getModelToken(CaseCategoriesModel),
          useClass: jest.fn(() => ({})),
        },
        {
          provide: getModelToken(CasePublishedAdvertsModel),
          useClass: jest.fn(() => ({})),
        },
        {
          provide: getModelToken(AdvertCorrectionModel),
          useClass: jest.fn(() => ({})),
        },
        {
          provide: getModelToken(AdvertMainTypeModel),
          useClass: jest.fn(() => ({})),
        },
        {
          provide: getModelToken(CaseHistoryModel),
          useClass: jest.fn(() => ({})),
        },
        {
          provide: getModelToken(CaseAdditionsModel),
          useClass: jest.fn(() => ({})),
        },
        {
          provide: AdvertCategoryModel,
          useClass: jest.fn(() => ({})),
        },
        {
          provide: LOGGER_PROVIDER,
          useClass: jest.fn(() => ({
            info: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
          })),
        },
        {
          provide: CACHE_MANAGER,
          useClass: jest.fn(() => ({
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
          })),
        },
        {
          provide: Sequelize,
          useClass: jest.fn(() => ({
            transaction: () => ({}),
          })),
        },
      ],
    }).compile()
    caseService = app.get<ICaseService>(ICaseService)
    commentService = app.get<ICommentServiceV2>(ICommentServiceV2)
    applicationService = app.get<IApplicationService>(IApplicationService)
    journalService = app.get<IJournalService>(IJournalService)
    runner = app.get<IReindexRunnerService>(IReindexRunnerService)
    attachmentService = app.get<IAttachmentService>(IAttachmentService)
    externalService = app.get<IExternalService>(IExternalService)
    signatureService = app.get<ISignatureService>(ISignatureService)
    s3Service = app.get<IAWSService>(IAWSService)
    caseCreateService = app.get<ICaseCreateService>(ICaseCreateService)
    caseUpdateService = app.get<ICaseUpdateService>(ICaseUpdateService)
    advertModel = app.get<AdvertModel>(getModelToken(AdvertModel))
    advertMainTypeModel = app.get<AdvertMainTypeModel>(
      getModelToken(AdvertMainTypeModel),
    )
    caseModel = app.get<CaseModel>(getModelToken(CaseModel))
    caseCategoriesModel = app.get<CaseCategoriesModel>(
      getModelToken(CaseCategoriesModel),
    )
    caseChannelModel = app.get<CaseChannelModel>(
      getModelToken(CaseChannelModel),
    )
    caseChannelsModel = app.get<CaseChannelsModel>(
      getModelToken(CaseChannelsModel),
    )
    categoriesModel = app.get<CaseCategoriesModel>(
      getModelToken(CaseCategoriesModel),
    )
    sequelize = app.get<Sequelize>(Sequelize)
    utilityService = app.get<IUtilityService>(IUtilityService)
    casePublishedAdvertsModel = app.get(
      getModelToken(CasePublishedAdvertsModel),
    )
  })
  describe('create', () => {
    const body = { applicationId: '123' } as PostApplicationBody
    // TODO: this needs fixing
    it('should create a case', async () => {
      // method should fail and a transaction rollback should happen
      jest.spyOn(caseService, 'createCase').mockImplementationOnce(() => {
        throw new Error()
      })
    })
  })

  describe('updateAdvert (correction)', () => {
    const advertId = 'advert-1'
    const activeCase = {
      id: 'case-1',
      advertId,
      advertTitle: 'Nýtt heiti auglýsingar',
      requestedPublicationDate: '2026-01-01T00:00:00.000Z',
      advert: { id: advertId, documentPdfUrl: 'https://cdn.test/a.pdf' },
      signature: { html: '<p>undirritun</p>' },
      department: { title: 'A deild' },
      additions: [],
      attachments: [],
    }

    let updatePublishedAdvert: jest.SpyInstance
    let updateItemInIndex: jest.SpyInstance
    let afterCommitCallbacks: Array<() => Promise<void>>

    const runAfterCommit = () =>
      Promise.all(afterCommitCallbacks.map((cb) => cb()))

    beforeEach(() => {
      afterCommitCallbacks = []
      jest.spyOn(sequelize, 'transaction').mockResolvedValue({
        commit: jest.fn(),
        rollback: jest.fn(),
        afterCommit: (cb: () => Promise<void>) => {
          afterCommitCallbacks.push(cb)
        },
      } as never)
      updateItemInIndex = jest
        .spyOn(runner, 'updateItemInIndex')
        .mockResolvedValue({ advertId, success: true })
      jest
        .spyOn(caseModel as unknown as typeof CaseModel, 'findByPk')
        .mockResolvedValue(activeCase as never)
      updatePublishedAdvert = jest
        .spyOn(journalService, 'updateAdvert')
        .mockResolvedValue(ResultWrapper.ok({ advert: {} }) as never)

      jest
        .spyOn(caseService as never, 'createPdfAndUpload')
        .mockResolvedValue(ResultWrapper.ok() as never)
      jest
        .spyOn(caseService as CaseService, 'updateAdvertByHtml')
        .mockResolvedValue(ResultWrapper.ok())
      jest
        .spyOn(caseService as CaseService, 'postCaseCorrection')
        .mockResolvedValue(ResultWrapper.ok())
    })

    afterEach(() => {
      jest.restoreAllMocks()
    })

    it('writes the case title to the published advert subject', async () => {
      await caseService.updateAdvert('case-1', {
        advertHtml: '<p>leiðrétt</p>',
        title: 'Leiðrétting á villu',
        description: 'Heiti lagfært',
      } as never)

      expect(updatePublishedAdvert).toHaveBeenCalledWith(
        advertId,
        expect.objectContaining({ subject: activeCase.advertTitle }),
      )
    })

    it('does not leak the correction title into the advert', async () => {
      await caseService.updateAdvert('case-1', {
        advertHtml: '<p>leiðrétt</p>',
        title: 'Leiðrétting á villu',
        description: 'Heiti lagfært',
      } as never)

      const [, body] = updatePublishedAdvert.mock.calls[0]
      expect(body).not.toHaveProperty('title')
      expect(body.subject).not.toBe('Leiðrétting á villu')
      expect(caseService.postCaseCorrection).toHaveBeenCalledWith(
        'case-1',
        expect.objectContaining({ title: 'Leiðrétting á villu' }),
        expect.anything(),
      )
    })

    it('reindexes the advert after the correction commits', async () => {
      await caseService.updateAdvert('case-1', {
        advertHtml: '<p>leiðrétt</p>',
        title: 'Leiðrétting á villu',
        description: 'Heiti lagfært',
      } as never)

      expect(updateItemInIndex).not.toHaveBeenCalled()
      await runAfterCommit()
      expect(updateItemInIndex).toHaveBeenCalledWith(advertId)
    })

    it('does not fail the correction when reindexing throws', async () => {
      updateItemInIndex.mockRejectedValueOnce(new Error('opensearch down'))

      await caseService.updateAdvert('case-1', {
        advertHtml: '<p>leiðrétt</p>',
        title: 'Leiðrétting á villu',
        description: 'Heiti lagfært',
      } as never)

      await expect(runAfterCommit()).resolves.toBeDefined()
    })
  })

  describe('updateCaseStatus (unpublish)', () => {
    const advertId = 'advert-1'
    const currentUser = { id: 'user-1' } as never

    let updateItemInIndex: jest.SpyInstance
    let afterCommitCallbacks: Array<() => unknown>

    const runAfterCommit = async () => {
      afterCommitCallbacks.forEach((cb) => cb())
      // The hook starts the reindex without awaiting it; let it settle.
      await new Promise((resolve) => setImmediate(resolve))
    }

    beforeEach(() => {
      afterCommitCallbacks = []
      jest.spyOn(sequelize, 'transaction').mockResolvedValue({
        commit: jest.fn(),
        rollback: jest.fn(),
        afterCommit: (cb: () => unknown) => {
          afterCommitCallbacks.push(cb)
        },
      } as never)
      updateItemInIndex = jest
        .spyOn(runner, 'updateItemInIndex')
        .mockResolvedValue({ advertId, success: true })
      Object.assign(caseUpdateService, {
        updateCaseStatus: jest.fn().mockResolvedValue(ResultWrapper.ok()),
      })
      Object.assign(casePublishedAdvertsModel, {
        findOne: jest.fn().mockResolvedValue({ advertId }),
      })
      Object.assign(utilityService, {
        advertStatusLookup: jest
          .fn()
          .mockResolvedValue(ResultWrapper.ok({ id: 'status-revoked' })),
      })
      jest
        .spyOn(journalService, 'updateAdvert')
        .mockResolvedValue(ResultWrapper.ok({ advert: {} }) as never)
    })

    afterEach(() => {
      jest.restoreAllMocks()
    })

    it('reindexes the revoked advert after the unpublish commits', async () => {
      await caseService.updateCaseStatus(
        'case-1',
        { status: CaseStatusEnum.Unpublished } as never,
        currentUser,
      )

      expect(updateItemInIndex).not.toHaveBeenCalled()
      await runAfterCommit()
      expect(updateItemInIndex).toHaveBeenCalledWith(advertId)
    })

    it('does not reindex for any other status change', async () => {
      await caseService.updateCaseStatus(
        'case-1',
        { status: CaseStatusEnum.Published } as never,
        currentUser,
      )

      await runAfterCommit()
      expect(afterCommitCallbacks).toHaveLength(0)
      expect(updateItemInIndex).not.toHaveBeenCalled()
    })

    it('logs and does not fail the unpublish when reindexing throws', async () => {
      updateItemInIndex.mockRejectedValueOnce(new Error('opensearch down'))
      const logError = jest.spyOn(
        (caseService as unknown as { logger: { error: () => void } }).logger,
        'error',
      )

      const result = await caseService.updateCaseStatus(
        'case-1',
        { status: CaseStatusEnum.Unpublished } as never,
        currentUser,
      )

      expect(result.result.ok).toBe(true)
      await runAfterCommit()
      expect(logError).toHaveBeenCalledWith(
        'Failed to reindex revoked advert',
        expect.objectContaining({ advertId, caseId: 'case-1' }),
      )
    })
  })
})
