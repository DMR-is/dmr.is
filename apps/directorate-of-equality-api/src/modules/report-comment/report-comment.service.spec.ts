import { BadRequestException } from '@nestjs/common'

import {
  ReportResourceActorKindEnum,
  type ReportResourceContext,
} from '../report/types/report-resource-context'
import { CreateReportCommentDto } from './dto/create-report-comment.dto'
import { CommentVisibilityEnum } from './models/report-comment.model'
import { CommentAuthorKindEnum } from './models/report-comment.model'
import { ReportCommentService } from './report-comment.service'

describe('ReportCommentService', () => {
  const logger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }

  const reportCommentModel = {
    findAll: jest.fn(),
    create: jest.fn(),
    findOneOrThrow: jest.fn(),
  }

  let service: ReportCommentService
  let reviewerContext: ReportResourceContext
  let companyContext: ReportResourceContext

  beforeEach(() => {
    jest.clearAllMocks()
    service = new ReportCommentService(
      logger as never,
      reportCommentModel as never,
    )
    reviewerContext = {
      reportId: 'report-1',
      reportStatus: 'IN_REVIEW' as never,
      actor: {
        kind: ReportResourceActorKindEnum.REVIEWER,
        userId: 'reviewer-1',
      },
    }
    companyContext = {
      reportId: 'report-1',
      reportStatus: 'SUBMITTED' as never,
      actor: {
        kind: ReportResourceActorKindEnum.CONTACT,
        nationalId: '5500000000',
      },
    }
  })

  it('creates a reviewer comment with the current report status snapshot', async () => {
    const commentDto = { id: 'comment-1' }

    reportCommentModel.create.mockResolvedValue({
      fromModel: () => commentDto,
    })

    const dto: CreateReportCommentDto = {
      visibility: CommentVisibilityEnum.INTERNAL,
      body: '  Needs follow-up  ',
    }

    const result = await service.create(reviewerContext, dto)

    expect(reportCommentModel.create).toHaveBeenCalledWith({
      reportId: 'report-1',
      authorKind: CommentAuthorKindEnum.REVIEWER,
      authorUserId: 'reviewer-1',
      visibility: CommentVisibilityEnum.INTERNAL,
      body: 'Needs follow-up',
      reportStatus: 'IN_REVIEW',
    })
    expect(result).toEqual(commentDto)
  })

  it('filters company users to external comments only', async () => {
    const commentDto = { id: 'comment-1' }

    reportCommentModel.findAll.mockResolvedValue([
      {
        fromModel: () => commentDto,
      },
    ])

    const result = await service.getByReportId(companyContext)

    expect(reportCommentModel.findAll).toHaveBeenCalledWith({
      where: {
        reportId: 'report-1',
        visibility: CommentVisibilityEnum.EXTERNAL,
      },
      order: [['createdAt', 'ASC']],
    })
    expect(result).toEqual([commentDto])
  })

  it('creates a company comment when the guard has already limited visibility', async () => {
    const commentDto = { id: 'comment-2' }

    reportCommentModel.create.mockResolvedValue({
      fromModel: () => commentDto,
    })

    const result = await service.create(companyContext, {
      visibility: CommentVisibilityEnum.EXTERNAL,
      body: 'Reply from company',
    })

    expect(reportCommentModel.create).toHaveBeenCalledWith({
      reportId: 'report-1',
      authorKind: CommentAuthorKindEnum.COMPANY_ADMIN,
      authorUserId: null,
      visibility: CommentVisibilityEnum.EXTERNAL,
      body: 'Reply from company',
      reportStatus: 'SUBMITTED',
    })
    expect(result).toEqual(commentDto)
  })

  it('rejects internal comments from company users', async () => {
    await expect(
      service.create(companyContext, {
        visibility: CommentVisibilityEnum.INTERNAL,
        body: 'Internal note',
      }),
    ).rejects.toThrow('Company admins may only create external comments')

    expect(reportCommentModel.create).not.toHaveBeenCalled()
  })

  it('rejects comments whose body becomes empty after trim', async () => {
    await expect(
      service.create(reviewerContext, {
        visibility: CommentVisibilityEnum.EXTERNAL,
        body: '   ',
      }),
    ).rejects.toBeInstanceOf(BadRequestException)

    expect(reportCommentModel.create).not.toHaveBeenCalled()
  })

  it('allows reviewers to delete their own comments only', async () => {
    const destroy = jest.fn().mockResolvedValue(undefined)

    reportCommentModel.findOneOrThrow.mockResolvedValue({
      authorKind: CommentAuthorKindEnum.REVIEWER,
      authorUserId: 'reviewer-1',
      destroy,
    })

    await service.delete(reviewerContext, 'comment-1')

    expect(destroy).toHaveBeenCalled()
  })
})
