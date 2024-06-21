import { Sequelize } from 'sequelize-typescript'
import { LOGGER_PROVIDER, LoggingModule } from '@dmr.is/logging'
import { Application, PostApplicationBody } from '@dmr.is/shared/dto'

import { getModelToken } from '@nestjs/sequelize'
import { Test } from '@nestjs/testing'

import { IApplicationService } from '../application/application.service.interface'
import { ICommentService } from '../comment/comment.service.interface'
import { IJournalService } from '../journal'
import { AdvertDepartmentDTO } from '../journal/models'
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
    sequelize = app.get<Sequelize>(Sequelize)
  })

  describe('create', () => {
    const body = { applicationId: '123' } as PostApplicationBody

    const application = {
      id: '1c65e8fd-bd6a-4038-9678-202770a85e89',
      applicant: '0101307789',
      assignees: ['5804170510'],
      state: 'submitted',
      status: 'completed',
      typeId: 'OfficialJournalOfIceland',
      created: '2024-05-06T10:22:05.863Z',
      modified: '2024-05-06T10:23:06.812Z',
      name: 'Stjórnartíðindi',
      applicantActors: [],
      answers: {
        advert: {
          type: 'faabd8a8-b327-4084-94bc-6001b0402be3',
          title: 'FORSETABRÉF ferðalag forseta erlendis',
          subType: '',
          document: '<p>Lorem ipsum dolor sit amet</p>',
          template: '',
          department: '3d918322-8e60-44ad-be5e-7485d0e45cdd',
        },
        preview: {
          document:
            '\n    <div class="advertisement readonly">\n      \n      \n    <div class="advertisement__title">\n    <div class="advertisement__title-main">FORSETABRÉF</div>\n      <div class="advertisement__title-sub">FORSETABRÉF ferðalag forseta erlendis</div>\n    </div>\n  \n      <div class="document-content">\n        <p>Lorem ipsum dolor sit amet</p>\n      </div>\n      <div class="document-signature">\n        \n      <div class="signature__group">\n          \n  <p class="signature__title">Hugsmiðjan, 30. apríl 2024</p>\n          <div class="signatures single">\n            \n  <div class="signature">\n    \n    <div class="signature__nameWrapper">\n      <p class="signature__name">Jón Bjarni\n        \n      </p>\n      \n    </div>\n  </div>\n  \n          </div>\n        </div>\n      </div>\n    </div>\n  ',
        },
        original: {
          files: [],
        },
        signature: {
          type: 'regular',
          regular: [
            {
              date: '2024-04-30',
              members: [
                {
                  name: 'Jón Bjarni',
                  above: '',
                  after: '',
                  below: '',
                },
              ],
              institution: 'Hugsmiðjan',
            },
          ],
          committee: {
            date: '',
            members: [
              {
                name: '',
                below: '',
              },
            ],
            chairman: {
              name: '',
              above: '',
              after: '',
              below: '',
            },
            institution: '',
          },
          signature:
            '\n      <div class="signature__group">\n          \n  <p class="signature__title">Hugsmiðjan, 30. apríl 2024</p>\n          <div class="signatures single">\n            \n  <div class="signature">\n    \n    <div class="signature__nameWrapper">\n      <p class="signature__name">Jón Bjarni\n        \n      </p>\n      \n    </div>\n  </div>\n  \n          </div>\n        </div>',
          additional: '',
        },
        publishing: {
          date: '2024-05-15',
          message: '',
          fastTrack: 'yes',
          contentCategories: [
            {
              label: 'Skipulagsmál',
              value: 'b113e386-bdf1-444f-a2ed-72807038cff1',
            },
          ],
          communicationChannels: [],
        },
        requirements: {
          approveExternalData: 'yes',
        },
        additionsAndDocuments: {
          files: [],
          fileNames: 'document',
        },
      },
      listed: true,
      pruned: false,
      prunedAt: null,
      externalData: {},
      progress: 1,
    } as unknown as Application

    it('should create a case', async () => {
      // TODO: Find out how to test the transactional code block
      const result = await caseService.create(body)

      expect(result).toBeDefined()
    })
  })
})
