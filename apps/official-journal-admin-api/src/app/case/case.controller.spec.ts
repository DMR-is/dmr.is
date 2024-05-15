import { Model } from 'sequelize-typescript'
import { LOGGER_PROVIDER, LoggingModule } from '@dmr.is/logging'
import { ALL_MOCK_CASES } from '@dmr.is/mocks'
import {
  CaseCommentDto,
  CaseCommentsDto,
  CaseCommentService,
  CaseCommentTaskDto,
  CaseCommentTitleDto,
  CaseCommentTypeDto,
  CaseDto,
  CaseService,
  IApplicationService,
  ICaseCommentService,
  ICaseService,
  IJournalService,
} from '@dmr.is/modules'
import { CaseComment } from '@dmr.is/shared/dto'

import { getModelToken } from '@nestjs/sequelize'
import { Test } from '@nestjs/testing'

import { CaseController } from './case.controller'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const provideModel = (model: any) => ({
  provide: getModelToken(model),
  useValue: model,
})

// mock sequelize models

describe('CaseController', () => {
  let caseService: ICaseService
  let commentService: ICaseCommentService
  let caseController: CaseController

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [LoggingModule],
      controllers: [CaseController],
      providers: [
        provideModel(CaseDto),
        provideModel(CaseCommentDto),
        provideModel(CaseCommentsDto),
        provideModel(CaseCommentTaskDto),
        provideModel(CaseCommentTitleDto),
        provideModel(CaseCommentTypeDto),
        {
          provide: ICaseService,
          useClass: CaseService,
        },
        {
          provide: ICaseCommentService,
          useClass: CaseCommentService,
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
    commentService = moduleRef.get<ICaseCommentService>(ICaseCommentService)
    caseController = moduleRef.get<CaseController>(CaseController)
  })

  describe('getCases', () => {
    it('should return correct case', async () => {
      const result = ALL_MOCK_CASES
      jest.spyOn(caseService, 'getCases')

      expect((await caseController.cases()).cases).toEqual(result)
    })
  })

  describe('getCase', () => {
    it('should return cases', async () => {
      const caseId = 'e6d7c050-a462-4183-972a-5c375e6e348d'
      const result = ALL_MOCK_CASES.find((c) => c.id === caseId)

      jest.spyOn(caseService, 'getCase')

      expect(await caseController.case(caseId)).toEqual(result)
    })
  })

  describe('getComment', () => {
    it('should return correct comment', async () => {
      const caseId = 'e6d7c050-a462-4183-972a-5c375e6e348d'
      const commentId = '76caef40-c98d-40bf-9c78-76832d2ea1d1'
      const result = ALL_MOCK_CASES.find((c) => c.id === caseId)?.comments.find(
        (c) => c.id === commentId,
      )

      jest.spyOn(commentService, 'getComment').mockResolvedValue({
        comment: result!,
      })

      expect(await caseController.getComment(caseId, commentId)).toEqual({
        comment: result,
      })
    })
  })

  describe('getComments', () => {
    it('should return correct comments', async () => {
      const caseId = 'e6d7c050-a462-4183-972a-5c375e6e348d'
      const result = ALL_MOCK_CASES.find((c) => c.id === caseId)?.comments

      jest.spyOn(commentService, 'getComments').mockResolvedValue({
        comments: result!,
      })

      expect(await caseController.getComments(caseId)).toEqual({
        comments: result,
      })
    })
  })

  describe('postComment', () => {
    it('should return correct comment', async () => {
      const caseId = 'e6d7c050-a462-4183-972a-5c375e6e348d'

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

      jest.spyOn(commentService, 'postComment').mockResolvedValue({
        comment: comment,
      })

      expect(
        await caseController.postComment(caseId, {
          comment: comment.task.comment!,
          from: comment.task.from!,
          internal: comment.internal,
          to: comment.task.to,
          type: comment.type,
        }),
      ).toEqual({
        comment: comment,
      })
    })
  })

  describe('deleteComment', () => {
    it('should return success `true`', async () => {
      const caseId = 'e6d7c050-a462-4183-972a-5c375e6e348d'
      const commentId = '76caef40-c98d-40bf-9c78-76832d2ea1d1'

      jest.spyOn(commentService, 'deleteComment').mockResolvedValue({
        success: true,
      })

      expect(await caseController.deleteComment(caseId, commentId)).toEqual({
        success: true,
      })
    })

    it('should return success `false`', async () => {
      const caseId = 'e6d7c050-a462-4183-972a-5c375e6e348d'
      const commentId = '76caef40-c98d-40bf-9c78-76832d2ea1d1'

      jest.spyOn(commentService, 'deleteComment').mockResolvedValue({
        success: false,
      })

      expect(await caseController.deleteComment(caseId, commentId)).toEqual({
        success: false,
      })
    })
  })
})
