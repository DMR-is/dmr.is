import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common'

import {
  CommunicationStatusEnum,
  ReportProviderEnum,
} from '../report/models/report.model'
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

  const companyReportModel = {
    findOne: jest.fn(),
  }

  const mailService = {
    sendExternalCommentNotification: jest.fn(),
  }

  const reportEventService = {
    emitEdited: jest.fn(),
  }

  const applicationSystemService = {
    notifyEdited: jest.fn(),
  }

  // A loaded report record the service can read `communicationStatus` off and
  // call `.update()` on to move the directional sub-state. Sourced from
  // island.is by default so the outbound edit notification is in play.
  const makeReport = (
    communicationStatus: CommunicationStatusEnum = CommunicationStatusEnum.NOT_STARTED,
  ) => ({
    id: 'report-1',
    communicationStatus,
    providerType: ReportProviderEnum.ISLAND_IS,
    providerId: 'application-1',
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
    companyReportModel.findOne.mockResolvedValue({ companyId: 'company-1' })
    service = new ReportCommentService(
      logger as never,
      reportCommentModel as never,
      reportModel as never,
      companyReportModel as never,
      mailService as never,
      reportEventService as never,
      applicationSystemService as never,
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
    const report = makeReport()
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

  // A reviewer's external comment IS the change request: no separate open
  // action, no separate send-to-edit button.
  it('opens a NOT_STARTED thread, logs EDITED and reopens the island.is application', async () => {
    const report = makeReport(CommunicationStatusEnum.NOT_STARTED)
    reportModel.findByPk.mockResolvedValue(report)
    reportCommentModel.create.mockResolvedValue(makeComment('comment-3c'))

    await service.create(reviewerContext, {
      visibility: CommentVisibilityEnum.EXTERNAL,
      body: 'First message to the applicant',
    })

    expect(report.update).toHaveBeenCalledWith({
      communicationStatus: CommunicationStatusEnum.AWAITING_RESPONSE,
    })
    expect(reportEventService.emitEdited).toHaveBeenCalledWith(
      'report-1',
      'IN_REVIEW',
      'company-1',
    )
    expect(applicationSystemService.notifyEdited).toHaveBeenCalledWith(
      'application-1',
    )
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

  // A follow-up sent before the applicant has replied is a second message on a
  // conversation already handed over, not a second change request.
  it('does not re-drive island.is when the thread is already AWAITING_RESPONSE', async () => {
    const report = makeReport(CommunicationStatusEnum.AWAITING_RESPONSE)
    const commentRecord = makeComment('comment-3d')
    reportModel.findByPk.mockResolvedValue(report)
    reportCommentModel.create.mockResolvedValue(commentRecord)

    await service.create(reviewerContext, {
      visibility: CommentVisibilityEnum.EXTERNAL,
      body: 'Just a nudge',
    })

    expect(report.update).not.toHaveBeenCalled()
    expect(reportEventService.emitEdited).not.toHaveBeenCalled()
    expect(applicationSystemService.notifyEdited).not.toHaveBeenCalled()
    // The applicant still hears about the message itself.
    expect(mailService.sendExternalCommentNotification).toHaveBeenCalledWith(
      report,
      commentRecord,
    )
  })

  it('posts the comment and warns when the report has no parent company snapshot', async () => {
    companyReportModel.findOne.mockResolvedValue(null)
    reportModel.findByPk.mockResolvedValue(makeReport())
    reportCommentModel.create.mockResolvedValue(makeComment('comment-3e'))

    await expect(
      service.create(reviewerContext, {
        visibility: CommentVisibilityEnum.EXTERNAL,
        body: 'Please update the report',
      }),
    ).resolves.toEqual({ id: 'comment-3e' })

    expect(reportEventService.emitEdited).not.toHaveBeenCalled()
    expect(logger.warn).toHaveBeenCalled()
    // The applicant is still let back in — the missing audit row must not cost
    // them the ability to resubmit.
    expect(applicationSystemService.notifyEdited).toHaveBeenCalledWith(
      'application-1',
    )
  })

  it('rejects a reviewer external comment when the report is not in review', async () => {
    reportModel.findByPk.mockResolvedValue(makeReport())

    await expect(
      service.create(
        { ...reviewerContext, reportStatus: 'SUBMITTED' as never },
        {
          visibility: CommentVisibilityEnum.EXTERNAL,
          body: 'This should be blocked',
        },
      ),
    ).rejects.toBeInstanceOf(BadRequestException)

    expect(reportCommentModel.create).not.toHaveBeenCalled()
  })

  it('keeps a reviewer internal note silent — no mail, no status move, no edit dispatch', async () => {
    const report = makeReport()
    reportModel.findByPk.mockResolvedValue(report)
    reportCommentModel.create.mockResolvedValue(makeComment('comment-4'))

    await service.create(reviewerContext, {
      visibility: CommentVisibilityEnum.INTERNAL,
      body: 'Internal reviewer note',
    })

    expect(mailService.sendExternalCommentNotification).not.toHaveBeenCalled()
    expect(report.update).not.toHaveBeenCalled()
    expect(reportEventService.emitEdited).not.toHaveBeenCalled()
    expect(applicationSystemService.notifyEdited).not.toHaveBeenCalled()
  })

  it('does not fail the comment when the outbound edit notification throws', async () => {
    reportModel.findByPk.mockResolvedValue(makeReport())
    reportCommentModel.create.mockResolvedValue(makeComment('comment-5'))
    applicationSystemService.notifyEdited.mockRejectedValueOnce(
      new Error('island.is is down'),
    )

    await expect(
      service.create(reviewerContext, {
        visibility: CommentVisibilityEnum.EXTERNAL,
        body: 'Please update the report',
      }),
    ).resolves.toEqual({ id: 'comment-5' })
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
