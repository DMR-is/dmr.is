/* eslint-disable @typescript-eslint/no-unused-vars */
import { Sequelize } from 'sequelize-typescript'
import { LOGGER_PROVIDER, LoggingModule } from '@dmr.is/logging'
import { Application, PostApplicationBody } from '@dmr.is/shared/dto'

import { getModelToken } from '@nestjs/sequelize'
import { Test } from '@nestjs/testing'

import { IApplicationService } from '../application/application.service.interface'
import { IAttachmentService } from '../attachments/attachment.service.interface'
import { ICommentService } from '../comment/comment.service.interface'
import { IJournalService } from '../journal'
import {
  AdvertCategoryModel,
  AdvertDepartmentModel,
  AdvertModel,
} from '../journal/models'
import { IPdfService } from '../pdf/pdf.service.interface'
import { IS3Service } from '../s3/s3.service.interface'
import { ISignatureService } from '../signature/signature.service.interface'
import { IUtilityService } from '../utility/utility.service.interface'
import { CaseCategoriesModel } from './models/case-categories.model'
import { ICaseCreateService } from './services/create/case-create.service.interface'
import { ICaseUpdateService } from './services/update/case-update.service.interface'
import { CaseService } from './case.service'
import { ICaseService } from './case.service.interface'
import {
  CaseChannelModel,
  CaseChannelsModel,
  CaseCommunicationStatusModel,
  CaseModel,
  CasePublishedAdvertsModel,
  CaseStatusModel,
  CaseTagModel,
} from './models'

describe('CaseService', () => {
  let caseService: ICaseService
  let commentService: ICommentService
  let applicationService: IApplicationService
  let journalService: IJournalService
  let signatureService: ISignatureService
  let attachmentService: IAttachmentService
  let s3Service: IS3Service
  let caseModel: CaseModel
  let advertModel: AdvertModel
  let categoriesModel: CaseCategoriesModel
  let advertCategoryModel: AdvertCategoryModel
  let caseCategoriesModel: CaseCategoriesModel
  let caseChannelModel: CaseChannelModel
  let caseChannelsModel: CaseChannelsModel
  let caseCreateService: ICaseCreateService
  let caseUpdateService: ICaseUpdateService
  let pdfService: IPdfService
  let sequelize: Sequelize

  beforeAll(async () => {
    const app = await Test.createTestingModule({
      imports: [LoggingModule],
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
          provide: IJournalService,
          useClass: jest.fn(() => ({})),
        },
        {
          provide: IAttachmentService,
          useClass: jest.fn(() => ({})),
        },
        {
          provide: IS3Service,
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
    journalService = app.get<IJournalService>(IJournalService)
    attachmentService = app.get<IAttachmentService>(IAttachmentService)
    signatureService = app.get<ISignatureService>(ISignatureService)
    s3Service = app.get<IS3Service>(IS3Service)
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
