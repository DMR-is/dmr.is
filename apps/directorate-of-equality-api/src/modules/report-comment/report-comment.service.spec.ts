import { BadRequestException } from '@nestjs/common'

import {
  type ReportResourceContext,
  ReportRoleEnum,
} from '../report/types/report-resource-context'
import { UserModel } from '../user/models/user.model'
import { CreateReportCommentDto } from './dto/create-report-comment.dto'
import { CommentVisibilityEnum } from './models/report-comment.model'
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

  const reportModel = {
    findByPk: jest.fn(),
  }

  const mailService = {
    sendExternalCommentNotification: jest.fn(),
  }

  let service: ReportCommentService
  let reviewerContext: ReportResourceContext
  let companyContext: ReportResourceContext

  beforeEach(() => {
    jest.clearAllMocks()
    service = new ReportCommentService(
      logger as never,
      reportCommentModel as never,
      reportModel as never,
      mailService as never,
    )
    reviewerContext = {
      reportId: 'report-1',
      reportStatus: 'IN_REVIEW' as never,
      actor: {
        kind: ReportRoleEnum.REVIEWER,
        userId: 'reviewer-1',
      },
    }
    companyContext = {
      reportId: 'report-1',
      reportStatus: 'SUBMITTED' as never,
      actor: {
        kind: ReportRoleEnum.COMPANY,
        nationalId: '5500000000',
      },
    }
  })

  it('creates a reviewer comment with the current report status snapshot', async () => {
    const commentDto = { id: 'comment-1' }
    const commentRecord = {
      id: 'comment-1',
      fromModel: () => commentDto,
      reload: jest.fn(),
    }

    reportCommentModel.create.mockResolvedValue(commentRecord)

    const dto: CreateReportCommentDto = {
      visibility: CommentVisibilityEnum.INTERNAL,
      body: '  Needs follow-up  ',
    }

    const result = await service.create(reviewerContext, dto)

    expect(reportCommentModel.create).toHaveBeenCalledWith({
      reportId: 'report-1',
      authorKind: ReportRoleEnum.REVIEWER,
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
      include: [{ model: UserModel, as: 'author', required: false }],
    })
    expect(result).toEqual([commentDto])
  })

  it('creates a company comment when the guard has already limited visibility', async () => {
    const commentDto = { id: 'comment-2' }

    reportCommentModel.create.mockResolvedValue({
      id: 'comment-2',
      fromModel: () => commentDto,
      reload: jest.fn(),
    })

    const result = await service.create(companyContext, {
      visibility: CommentVisibilityEnum.EXTERNAL,
      body: 'Reply from company',
    })

    expect(reportCommentModel.create).toHaveBeenCalledWith({
      reportId: 'report-1',
      authorKind: ReportRoleEnum.COMPANY,
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

  it('sends an external comment notification when a reviewer posts an external comment', async () => {
    const commentRecord = {
      id: 'comment-3',
      fromModel: () => ({ id: 'comment-3' }),
      reload: jest.fn(),
    }
    const reportRecord = { id: 'report-1' }

    reportCommentModel.create.mockResolvedValue(commentRecord)
    reportModel.findByPk.mockResolvedValue(reportRecord)

    await service.create(reviewerContext, {
      visibility: CommentVisibilityEnum.EXTERNAL,
      body: 'Please update the report',
    })

    expect(reportModel.findByPk).toHaveBeenCalledWith('report-1')
    expect(mailService.sendExternalCommentNotification).toHaveBeenCalledWith(
      reportRecord,
      commentRecord,
    )
  })

  it('does not send mail for reviewer internal comments', async () => {
    reportCommentModel.create.mockResolvedValue({
      id: 'comment-4',
      fromModel: () => ({ id: 'comment-4' }),
      reload: jest.fn(),
    })

    await service.create(reviewerContext, {
      visibility: CommentVisibilityEnum.INTERNAL,
      body: 'Internal reviewer note',
    })

    expect(reportModel.findByPk).not.toHaveBeenCalled()
    expect(mailService.sendExternalCommentNotification).not.toHaveBeenCalled()
  })

  it('does not send mail for company-authored comments', async () => {
    reportCommentModel.create.mockResolvedValue({
      id: 'comment-5',
      fromModel: () => ({ id: 'comment-5' }),
      reload: jest.fn(),
    })

    await service.create(companyContext, {
      visibility: CommentVisibilityEnum.EXTERNAL,
      body: 'Reply from company',
    })

    expect(reportModel.findByPk).not.toHaveBeenCalled()
    expect(mailService.sendExternalCommentNotification).not.toHaveBeenCalled()
  })

  it('skips mail when the report cannot be loaded', async () => {
    reportCommentModel.create.mockResolvedValue({
      id: 'comment-6',
      fromModel: () => ({ id: 'comment-6' }),
      reload: jest.fn(),
    })
    reportModel.findByPk.mockResolvedValue(null)

    await service.create(reviewerContext, {
      visibility: CommentVisibilityEnum.EXTERNAL,
      body: 'External reviewer comment',
    })

    expect(mailService.sendExternalCommentNotification).not.toHaveBeenCalled()
  })

  it('allows reviewers to delete their own comments only', async () => {
    const destroy = jest.fn().mockResolvedValue(undefined)

    reportCommentModel.findOneOrThrow.mockResolvedValue({
      authorKind: ReportRoleEnum.REVIEWER,
      authorUserId: 'reviewer-1',
      destroy,
    })

    await service.delete(reviewerContext, 'comment-1')

    expect(destroy).toHaveBeenCalled()
  })
})
