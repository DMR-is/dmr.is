import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common'

import { CommunicationStatusEnum } from '../report/models/report.model'
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

  // A loaded report record the service can read `communicationStatus` off and
  // call `.update()` on to move the directional sub-state.
  const makeReport = (
    communicationStatus: CommunicationStatusEnum = CommunicationStatusEnum.NOT_STARTED,
  ) => ({
    id: 'report-1',
    communicationStatus,
    update: jest.fn(),
  })

  const makeComment = (id: string) => ({
    id,
    fromModel: () => ({ id }),
    reload: jest.fn(),
  })

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
    reportModel.findByPk.mockResolvedValue(makeReport())
    reportCommentModel.create.mockResolvedValue(makeComment('comment-1'))

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
    expect(result).toEqual({ id: 'comment-1' })
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

  it('creates a company comment and flips the thread to RESPONSE_RECEIVED', async () => {
    const report = makeReport(CommunicationStatusEnum.AWAITING_RESPONSE)
    reportModel.findByPk.mockResolvedValue(report)
    reportCommentModel.create.mockResolvedValue(makeComment('comment-2'))

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
    expect(report.update).toHaveBeenCalledWith({
      communicationStatus: CommunicationStatusEnum.RESPONSE_RECEIVED,
    })
    expect(result).toEqual({ id: 'comment-2' })
  })

  it('rejects a company comment when communication is not open', async () => {
    reportModel.findByPk.mockResolvedValue(
      makeReport(CommunicationStatusEnum.NOT_STARTED),
    )

    await expect(
      service.create(companyContext, {
        visibility: CommentVisibilityEnum.EXTERNAL,
        body: 'Reply from company',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException)

    expect(reportCommentModel.create).not.toHaveBeenCalled()
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

  it('rejects reviewer internal comments on a draft report', async () => {
    reportModel.findByPk.mockResolvedValue(makeReport())

    await expect(
      service.create(
        {
          ...reviewerContext,
          reportStatus: 'DRAFT' as never,
        },
        {
          visibility: CommentVisibilityEnum.INTERNAL,
          body: 'Internal note',
        },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException)

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

  it('throws NotFound when the report cannot be loaded', async () => {
    reportModel.findByPk.mockResolvedValue(null)

    await expect(
      service.create(reviewerContext, {
        visibility: CommentVisibilityEnum.EXTERNAL,
        body: 'External reviewer comment',
      }),
    ).rejects.toBeInstanceOf(NotFoundException)

    expect(reportCommentModel.create).not.toHaveBeenCalled()
  })

  it('sends an external comment notification when a reviewer posts an external comment', async () => {
    const report = makeReport(CommunicationStatusEnum.OPEN)
    const commentRecord = makeComment('comment-3')

    reportModel.findByPk.mockResolvedValue(report)
    reportCommentModel.create.mockResolvedValue(commentRecord)

    await service.create(reviewerContext, {
      visibility: CommentVisibilityEnum.EXTERNAL,
      body: 'Please update the report',
    })

    expect(mailService.sendExternalCommentNotification).toHaveBeenCalledWith(
      report,
      commentRecord,
    )
  })

  it('rejects a reviewer external comment when communication is not open', async () => {
    reportModel.findByPk.mockResolvedValue(
      makeReport(CommunicationStatusEnum.NOT_STARTED),
    )

    await expect(
      service.create(reviewerContext, {
        visibility: CommentVisibilityEnum.EXTERNAL,
        body: 'This should be blocked',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException)

    expect(reportCommentModel.create).not.toHaveBeenCalled()
  })

  it('flips an open thread back to AWAITING_RESPONSE on a reviewer external reply', async () => {
    const report = makeReport(CommunicationStatusEnum.RESPONSE_RECEIVED)
    reportModel.findByPk.mockResolvedValue(report)
    reportCommentModel.create.mockResolvedValue(makeComment('comment-3b'))

    await service.create(reviewerContext, {
      visibility: CommentVisibilityEnum.EXTERNAL,
      body: 'Thanks, one more thing',
    })

    expect(report.update).toHaveBeenCalledWith({
      communicationStatus: CommunicationStatusEnum.AWAITING_RESPONSE,
    })
  })

  it('flips OPEN to AWAITING_RESPONSE on a reviewer external comment', async () => {
    const report = makeReport(CommunicationStatusEnum.OPEN)
    reportModel.findByPk.mockResolvedValue(report)
    reportCommentModel.create.mockResolvedValue(makeComment('comment-3c'))

    await service.create(reviewerContext, {
      visibility: CommentVisibilityEnum.EXTERNAL,
      body: 'First message to the applicant',
    })

    expect(report.update).toHaveBeenCalledWith({
      communicationStatus: CommunicationStatusEnum.AWAITING_RESPONSE,
    })
  })

  it('does not send mail for reviewer internal comments', async () => {
    reportModel.findByPk.mockResolvedValue(makeReport())
    reportCommentModel.create.mockResolvedValue(makeComment('comment-4'))

    await service.create(reviewerContext, {
      visibility: CommentVisibilityEnum.INTERNAL,
      body: 'Internal reviewer note',
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
