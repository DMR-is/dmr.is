/* eslint-disable unused-imports/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Sequelize } from 'sequelize-typescript'
import {
  AdvertCategoryModel,
  AdvertCorrectionModel,
  AdvertDepartmentModel,
  AdvertModel,
  CaseCategoriesModel,
  CaseChannelModel,
  CaseChannelsModel,
  CaseCommunicationStatusModel,
  CaseHistoryModel,
  CaseModel,
  CaseStatusModel,
  CaseTagModel,
} from '@dmr.is/official-journal/models'
import { IAttachmentService } from '@dmr.is/official-journal/modules/attachment'
import {
  CaseService,
  ICaseService,
} from '@dmr.is/official-journal/modules/case'
import { ICommentService } from '@dmr.is/official-journal/modules/comment'
import { IPdfService } from '@dmr.is/official-journal/modules/pdf'
import { IPriceService } from '@dmr.is/official-journal/modules/price'
import { ISignatureService } from '@dmr.is/official-journal/modules/signature'
import { IUtilityService } from '@dmr.is/official-journal/modules/utility'
import { PostApplicationBody } from '@dmr.is/shared/dto'
import { IApplicationService } from '@dmr.is/shared/modules/application'
import { IAWSService } from '@dmr.is/shared/modules/aws'

import { getModelToken } from '@nestjs/sequelize'
import { Test } from '@nestjs/testing'

import { IOfficialJournalCaseService } from './ojoi-case.service.interface'

describe('CaseService', () => {
  let caseService: ICaseService
  let commentService: ICommentService
  let applicationService: IApplicationService
  let journalService: IOfficialJournalCaseService
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
          provide: ICommentService,
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
          provide: IAttachmentService,
          useClass: jest.fn(() => ({})),
        },
        {
          provide: IAWSService,
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
    commentService = app.get<ICommentService>(ICommentService)
    applicationService = app.get<IApplicationService>(IApplicationService)

    attachmentService = app.get<IAttachmentService>(IAttachmentService)
    signatureService = app.get<ISignatureService>(ISignatureService)
    s3Service = app.get<IAWSService>(IAWSService)
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
