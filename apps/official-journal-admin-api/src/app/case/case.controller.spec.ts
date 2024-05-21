import { LOGGER_PROVIDER, LoggingModule } from '@dmr.is/logging'
import {
  IApplicationService,
  ICaseService,
  ICommentService,
  IJournalService,
} from '@dmr.is/modules'
import {
  CaseComment,
  CaseCommentTitle,
  CaseCommentType,
  CaseCommunicationStatus,
  CaseStatus,
  CaseTag,
} from '@dmr.is/shared/dto'

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
    caseNumber: 1234,
    isLegacy: true,
    status: CaseStatus.Submitted,
    tag: CaseTag.NotStarted,
    createdAt: '2024-03-12T12:45:48.21Z',
    modifiedAt: '2024-03-12T12:45:48.21Z',
    publishedAt: null,
    paid: false,
    price: null,
    fastTrack: false,
    assignedTo: null,
    communicationStatus: CaseCommunicationStatus.NotStarted,
    comments: [comment],
  }

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [LoggingModule],
      controllers: [CaseController],
      providers: [
        {
          provide: ICaseService,
          useClass: jest.fn(() => ({
            create: () => ({}),
          })),
        },
        {
          provide: ICommentService,
          useClass: jest.fn(() => ({
            create: () => ({}),
            delete: () => ({}),
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
      const createSpy = jest.spyOn(caseService, 'create')

      jest.spyOn(caseService, 'create').mockImplementation(() =>
        Promise.resolve({
          case: activeCase,
        }),
      )

      const result = await caseController.createCase({
        applicationId: activeCase.applicationId,
      })

      expect(createSpy).toHaveBeenCalledWith({
        applicationId: activeCase.applicationId,
      })

      expect(result).toEqual({
        case: activeCase,
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
        from: '3d918322-8e60-44ad-be5e-7485d0e45cdd',
        to: 'Ármann',
        title: 'gerir athugasemd',
        comment: 'getur þú athugað þetta?',
      },
    } as unknown as CaseComment

    it('should return correct comment', async () => {
      const createSpy = jest.spyOn(commentService, 'create')

      jest.spyOn(commentService, 'create').mockImplementation(() =>
        Promise.resolve({
          comment: comment,
        }),
      )

      const results = await caseController.createComment(activeCase.id, {
        comment: comment.task.comment,
        from: `${comment.task.from}`,
        to: comment.task.to,
        internal: comment.internal,
        type: comment.type,
      })

      expect(createSpy).toHaveBeenCalledWith(activeCase.id, {
        comment: comment.task.comment,
        from: `${comment.task.from}`,
        to: comment.task.to,
        internal: comment.internal,
        type: comment.type,
      })

      expect(results).toEqual({
        comment: comment,
      })
    })
  })

  describe('deleteComment', () => {
    it('should delete a comment', async () => {
      jest
        .spyOn(commentService, 'delete')
        .mockImplementation(() => Promise.resolve({ success: true }))
      const deleteSpy = jest.spyOn(commentService, 'delete')

      await caseController.deleteComment('caseId', 'commentId')

      expect(deleteSpy).toHaveBeenCalledWith('caseId', 'commentId')
    })

    it('should throw error if comment not found', async () => {
      const unknownId = 'fa81d7a9-934c-47c3-b45c-12f1014bd425'

      jest
        .spyOn(commentService, 'delete')
        .mockImplementation(() => Promise.resolve(null))

      try {
        expect(await caseController.deleteComment(unknownId, comment.id))
        expect('Should not reach here').toEqual('')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (e: any) {
        expect(e.message).toEqual(
          `Comment<${comment.id}> not found on case<${unknownId}>`,
        )
        expect(e.status).toEqual(404)
      }
    })
  })
})
