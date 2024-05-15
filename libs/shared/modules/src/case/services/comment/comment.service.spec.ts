import { LOGGER_PROVIDER, LoggingModule } from '@dmr.is/logging'
import { CaseCommentTitle } from '@dmr.is/shared/dto'

import { getModelToken } from '@nestjs/sequelize'
import { Test } from '@nestjs/testing'

import {
  CaseCommentDto,
  CaseCommentsDto,
  CaseCommentTaskDto,
  CaseCommentTitleDto,
  CaseCommentTypeDto,
  CaseDto,
} from '../../models'
import { CaseCommentService } from './comment.service'
import { ICaseCommentService } from './comment.service.interface'

describe('CommentService', () => {
  let commentService: ICaseCommentService

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [LoggingModule],
      providers: [
        {
          provide: ICaseCommentService,
          useClass: CaseCommentService,
        },
        {
          provide: getModelToken(CaseDto),
          useValue: jest.fn(),
        },
        {
          provide: getModelToken(CaseCommentDto),
          useValue: jest.fn(),
        },
        {
          provide: getModelToken(CaseCommentsDto),
          useValue: jest.fn(),
        },
        {
          provide: getModelToken(CaseCommentTitleDto),
          useValue: jest.fn(),
        },
        {
          provide: getModelToken(CaseCommentTaskDto),
          useValue: jest.fn(),
        },
        {
          provide: getModelToken(CaseCommentTypeDto),
          useValue: jest.fn(),
        },
        {
          provide: LOGGER_PROVIDER,
          useValue: {
            debug: jest.fn(),
            error: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
          },
        },
      ],
    }).compile()
    commentService = moduleRef.get(ICaseCommentService)
  })

  describe('getComment', () => {
    it('Should throw not found error, `Comment not found`', async () => {
      expect(commentService.getComment('123', '123')).toThrow()
    })
  })
})
