/* eslint-disable @typescript-eslint/no-unused-vars */
import { Sequelize } from 'sequelize-typescript'
import { getModelToken } from '@nestjs/sequelize'
import { Test } from '@nestjs/testing'

import { ICaseCreateService } from './services/create/case-create.service.interface'
import { ICaseUpdateService } from './services/update/case-update.service.interface'
import { CaseService } from './case.service'
import { ICaseService } from './ojoi-case.service.interface'
import {
  CaseModel,
  CaseHistoryModel,
  AdvertModel,
  CaseCategoriesModel,
  AdvertCategoryModel,
  CaseChannelModel,
  CaseChannelsModel,
  CaseStatusModel,
  CaseTagModel,
  CaseCommunicationStatusModel,
  AdvertDepartmentModel,
  AdvertCorrectionModel,
} from '@dmr.is/official-journal/models'
import {
  IApplicationService,
  PostApplicationBody,
} from '@dmr.is/official-journal/modules/application'
import { IAttachmentService } from '@dmr.is/official-journal/modules/attachment'
import { IJournalService } from '@dmr.is/official-journal/modules/journal'
import { ISignatureService } from '@dmr.is/official-journal/modules/signature'

describe('CaseService', () => {
  let caseService: ICaseService
  let commentService: ICommentServiceV2
  let applicationService: IApplicationService
  let journalService: IJournalService
  let signatureService: ISignatureService
  let attachmentService: IAttachmentService
  let s3Service: IAWSService
  let caseModel: CaseModel
  let caseHistoryModel: CaseHistoryModel
  let advertModel: AdvertModel
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

  beforeAll(async () => {
    const app = await Test.createTestingModule({
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
          provide: IUtilityService,
          useClass: jest.fn(() => ({})),
        },
        {
          provide: IJournalService,
          useClass: jest.fn(() => ({})),
        },
        {
          provide: IAttachmentService,
          useClass: jest.fn(() => ({})),
        },
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
          provide: getModelToken(CaseModel),
          useClass: jest.fn(() => ({
            create: () => ({}),
            findOne: () => ({}),
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
          provide: getModelToken(CaseHistoryModel),
          useClass: jest.fn(() => ({})),
        },
        {
          provide: AdvertCategoryModel,
          useClass: jest.fn(() => ({})),
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
    attachmentService = app.get<IAttachmentService>(IAttachmentService)
    signatureService = app.get<ISignatureService>(ISignatureService)
    s3Service = app.get<IAWSService>(IAWSService)
    caseCreateService = app.get<ICaseCreateService>(ICaseCreateService)
    caseUpdateService = app.get<ICaseUpdateService>(ICaseUpdateService)
    advertModel = app.get<AdvertModel>(getModelToken(AdvertModel))
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
})
