/* eslint-disable @typescript-eslint/no-unused-vars */
import { Sequelize } from 'sequelize-typescript'
import { LOGGER_PROVIDER, LoggingModule } from '@dmr.is/logging'
import { Application, PostApplicationBody } from '@dmr.is/shared/dto'

import { getModelToken } from '@nestjs/sequelize'
import { Test } from '@nestjs/testing'

import { IApplicationService } from '../application/application.service.interface'
import { ICommentService } from '../comment/comment.service.interface'
import { IJournalService } from '../journal'
import { AdvertCategoryDTO, AdvertDepartmentDTO } from '../journal/models'
import { IUtilityService } from '../utility/utility.service.interface'
import { CaseCategoriesDto } from './models/CaseCategories'
import { CaseService } from './case.service'
import { ICaseService } from './case.service.interface'
import {
  CaseChannelDto,
  CaseChannelsDto,
  CaseCommunicationStatusDto,
  CaseDto,
  CaseStatusDto,
  CaseTagDto,
} from './models'

describe('CaseService', () => {
  let caseService: ICaseService
  let commentService: ICommentService
  let applicationService: IApplicationService
  let journalService: IJournalService
  let caseModel: CaseDto
  let categoriesModel: CaseCategoriesDto
  let advertCategoryModel: AdvertCategoryDTO
  let caseCategoriesModel: CaseCategoriesDto
  let caseChannelModel: CaseChannelDto
  let caseChannelsModel: CaseChannelsDto
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
          provide: IUtilityService,
          useClass: jest.fn(() => ({})),
        },
        {
          provide: IJournalService,
          useClass: jest.fn(() => ({})),
        },
        {
          provide: getModelToken(CaseDto),
          useClass: jest.fn(() => ({
            create: () => ({}),
            findOne: () => ({}),
            count: () => ({}),
          })),
        },
        {
          provide: getModelToken(CaseCategoriesDto),
          useClass: jest.fn(() => ({})),
        },
        {
          provide: getModelToken(AdvertCategoryDTO),
          useClass: jest.fn(() => ({})),
        },
        {
          provide: getModelToken(CaseStatusDto),
          useClass: jest.fn(() => ({
            create: () => ({}),
          })),
        },
        {
          provide: getModelToken(CaseTagDto),
          useClass: jest.fn(() => ({
            create: () => ({}),
          })),
        },
        {
          provide: getModelToken(CaseCommunicationStatusDto),
          useClass: jest.fn(() => ({
            create: () => ({}),
          })),
        },
        {
          provide: getModelToken(AdvertDepartmentDTO),
          useClass: jest.fn(() => ({
            create: () => ({}),
          })),
        },
        {
          provide: getModelToken(CaseChannelDto),
          useClass: jest.fn(() => ({})),
        },
        {
          provide: getModelToken(CaseChannelsDto),
          useClass: jest.fn(() => ({})),
        },
        {
          provide: getModelToken(CaseTagDto),
          useClass: jest.fn(() => ({})),
        },
        {
          provide: getModelToken(CaseCategoriesDto),
          useClass: jest.fn(() => ({})),
        },
        {
          provide: AdvertCategoryDTO,
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
    caseModel = app.get<CaseDto>(getModelToken(CaseDto))
    caseCategoriesModel = app.get<CaseCategoriesDto>(
      getModelToken(CaseCategoriesDto),
    )
    caseChannelModel = app.get<CaseChannelDto>(getModelToken(CaseChannelDto))
    caseChannelsModel = app.get<CaseChannelsDto>(getModelToken(CaseChannelsDto))
    categoriesModel = app.get<CaseCategoriesDto>(
      getModelToken(CaseCategoriesDto),
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
