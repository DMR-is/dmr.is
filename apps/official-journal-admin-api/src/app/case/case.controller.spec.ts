import { LOGGER_PROVIDER, LoggingModule } from '@dmr.is/logging'
import { JOURNAL_DEPARTMENT_B } from '@dmr.is/mocks'
import {
  IApplicationService,
  ICaseService,
  ICommentService,
  IJournalService,
} from '@dmr.is/modules'
import {
  Case,
  CaseComment,
  CaseCommentTitle,
  CaseCommentType,
  CaseCommunicationStatus,
  CaseStatus,
} from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'

import { Test } from '@nestjs/testing'

import { CaseController } from './case.controller'

// mock sequelize models

describe('CaseController', () => {
  let caseService: ICaseService
  let commentService: ICommentService
  let caseController: CaseController

  const comment = {
    id: '76caef40-c98d-40bf-9c78-76832d2ea1d1',
    type: CaseCommentType.Submit,
    createdAt: '2024-03-12T12:45:48.21Z',
    caseStatus: CaseStatus.Submitted,
    internal: false,
    task: {
      from: null,
      to: 'Stofnun x',
      title: CaseCommentTitle.Submit,
      comment: null,
    },
  }

  const activeCase = {
    id: 'e6d7c050-a462-4183-972a-5c375e6e348d',
    applicationId: '1c65e8fd-bd6a-4038-9678-202770a85e89',
    year: 2024,
    caseNumber: '1234',
    isLegacy: true,
    status: CaseStatus.Submitted,
    tag: null,
    createdAt: '2024-03-12T12:45:48.21Z',
    modifiedAt: '2024-03-12T12:45:48.21Z',
    publishedAt: null,
    paid: false,
    price: null,
    fastTrack: false,
    assignedreceiver: null,
    communicationStatus: CaseCommunicationStatus.NotStarted,
    comments: [comment],
    advertDepartment: JOURNAL_DEPARTMENT_B,
    advertTitle: 'Test adver title',
    requestedPublicationDate: '2024-03-12T12:45:48.21Z',
  } as unknown as Case

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [LoggingModule],
      controllers: [CaseController],
      providers: [
        {
          provide: ICaseService,
          useClass: jest.fn(() => ({
            createCase: () => ({}),
          })),
        },
        {
          provide: ICommentService,
          useClass: jest.fn(() => ({
            createComment: () => ({}),
            deleteComment: () => ({}),
          })),
        },
        {
          provide: IJournalService,
          useValue: jest.fn(),
        },
        {
          provide: IApplicationService,
          useValue: jest.fn(),
        },
        {
          provide: LOGGER_PROVIDER,
          useValue: {
            info: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
          },
        },
      ],
    }).compile()

    caseService = moduleRef.get<ICaseService>(ICaseService)
    commentService = moduleRef.get<ICommentService>(ICommentService)
    caseController = moduleRef.get<CaseController>(CaseController)
  })

  describe('createCase', () => {
    it('should create a case', async () => {
      const createSpy = jest.spyOn(caseService, 'createCase')

      jest
        .spyOn(caseService, 'createCase')
        .mockImplementation(() => Promise.resolve(ResultWrapper.ok()))

      await caseController.createCase({
        applicationId: activeCase.applicationId,
      })

      expect(createSpy).toHaveBeenCalledWith({
        applicationId: activeCase.applicationId,
      })
    })
  })

  describe('createComment', () => {
    const comment = {
      id: '76caef40-c98d-40bf-9c78-76832d2ea1d1',
      type: 'comment',
      createdAt: '2024-03-12T12:45:48.21Z',
      caseStatus: 'Innsent',
      internal: false,
      task: {
        initiator: '3d918322-8e60-44ad-be5e-7485d0e45cdd',
        receiver: 'Ármann',
        title: 'gerir athugasemd',
        comment: 'getur þú athugað þetta?',
      },
    } as unknown as CaseComment

    it('should create comment', async () => {
      const createSpy = jest.spyOn(commentService, 'createComment')

      jest
        .spyOn(commentService, 'createComment')
        .mockImplementation(() => Promise.resolve(ResultWrapper.ok()))

      await caseController.createComment(activeCase.id, {
        comment: comment.task.comment,
        initiator: `${comment.task.from}`,
        receiver: comment.task.to,
        internal: comment.internal,
        type: comment.type,
      })

      expect(createSpy).toHaveBeenCalledWith(activeCase.id, {
        comment: comment.task.comment,
        initiator: `${comment.task.from}`,
        receiver: comment.task.to,
        internal: comment.internal,
        type: comment.type,
      })
    })
  })

  describe('deleteComment', () => {
    it('should delete a comment', async () => {
      jest
        .spyOn(commentService, 'deleteComment')
        .mockImplementation(() => Promise.resolve(ResultWrapper.ok()))
      const deleteSpy = jest.spyOn(commentService, 'deleteComment')

      await caseController.deleteComment('caseId', 'commentId')

      expect(deleteSpy).toHaveBeenCalledWith('caseId', 'commentId')
    })

    // it('should throw error if comment not found', async () => {
    //   const unknownId = 'fa81d7a9-934c-47c3-b45c-12f1014bd425'

    //   jest.spyOn(commentService, 'deleteComment')

    //   await caseController.deleteComment(unknownId, comment.id)

    //   expect(commentService.deleteComment).toHaveBeenCalledWith(
    //     unknownId,
    //     comment.id,
    //   )
    // })
  })
})
