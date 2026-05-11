import { BadRequestException, ForbiddenException } from '@nestjs/common'

import { ReportStatusEnum } from '../report/models/report.model'
import {
  type ReportResourceContext,
  ReportRoleEnum,
} from '../report/types/report-resource-context'
import { DenyReportDto } from './dto/deny-report.dto'
import { ReportWorkflowService } from './report-workflow.service'

describe('ReportWorkflowService', () => {
  const logger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }

  const reportEventService = {
    emitSubmitted: jest.fn(),
    emitAssigned: jest.fn(),
    emitStatusChanged: jest.fn(),
    emitSuperseded: jest.fn(),
  }

  const reportModel = {
    update: jest.fn(),
    findOne: jest.fn(),
    findAll: jest.fn(),
  }

  const companyReportModel = {
    findOne: jest.fn(),
    findAll: jest.fn(),
  }

  const userModel = {
    findOne: jest.fn(),
  }

  let service: ReportWorkflowService

  const reviewerContext = (
    status: ReportStatusEnum,
  ): ReportResourceContext => ({
    reportId: 'report-1',
    reportStatus: status,
    actor: { kind: ReportRoleEnum.REVIEWER, userId: 'reviewer-1' },
  })

  const companyContext = (status: ReportStatusEnum): ReportResourceContext => ({
    reportId: 'report-1',
    reportStatus: status,
    actor: { kind: ReportRoleEnum.COMPANY, nationalId: '5500000000' },
  })

  beforeEach(() => {
    jest.clearAllMocks()
    service = new ReportWorkflowService(
      logger as never,
      reportEventService as never,
      reportModel as never,
      companyReportModel as never,
      userModel as never,
    )
  })

  describe('assign', () => {
    it('transitions SUBMITTED → IN_REVIEW and assigns the caller when no userId is given', async () => {
      reportModel.update.mockResolvedValue([1])
      reportModel.findOne.mockResolvedValue({ reviewerUserId: null })
      userModel.findOne.mockResolvedValue({
        id: 'reviewer-1',
        isActive: true,
      })
      reportEventService.emitAssigned.mockResolvedValue(undefined)

      await service.assign(reviewerContext(ReportStatusEnum.SUBMITTED), {})

      expect(reportModel.update).toHaveBeenCalledWith(
        {
          status: ReportStatusEnum.IN_REVIEW,
          reviewerUserId: 'reviewer-1',
        },
        { where: { id: 'report-1' } },
      )
      expect(reportEventService.emitAssigned).toHaveBeenCalledWith(
        'report-1',
        'reviewer-1',
        'reviewer-1',
        ReportStatusEnum.IN_REVIEW,
      )
      expect(reportEventService.emitStatusChanged).not.toHaveBeenCalled()
    })

    it('assigns a specific active user when userId is supplied', async () => {
      reportModel.update.mockResolvedValue([1])
      reportModel.findOne.mockResolvedValue({ reviewerUserId: null })
      userModel.findOne.mockResolvedValue({ id: 'user-2', isActive: true })
      reportEventService.emitAssigned.mockResolvedValue(undefined)

      await service.assign(reviewerContext(ReportStatusEnum.SUBMITTED), {
        userId: 'user-2',
      })

      expect(userModel.findOne).toHaveBeenCalledWith({
        where: { id: 'user-2' },
        attributes: ['id', 'isActive'],
      })
      expect(reportModel.update).toHaveBeenCalledWith(
        {
          status: ReportStatusEnum.IN_REVIEW,
          reviewerUserId: 'user-2',
        },
        { where: { id: 'report-1' } },
      )
      expect(reportEventService.emitAssigned).toHaveBeenCalledWith(
        'report-1',
        'reviewer-1',
        'user-2',
        ReportStatusEnum.IN_REVIEW,
      )
    })

    it('reassigns an IN_REVIEW report to a different user without changing status', async () => {
      reportModel.update.mockResolvedValue([1])
      reportModel.findOne.mockResolvedValue({ reviewerUserId: 'user-1' })
      userModel.findOne.mockResolvedValue({ id: 'user-2', isActive: true })
      reportEventService.emitAssigned.mockResolvedValue(undefined)

      await service.assign(reviewerContext(ReportStatusEnum.IN_REVIEW), {
        userId: 'user-2',
      })

      expect(reportModel.update).toHaveBeenCalledWith(
        {
          status: ReportStatusEnum.IN_REVIEW,
          reviewerUserId: 'user-2',
        },
        { where: { id: 'report-1' } },
      )
      expect(reportEventService.emitAssigned).toHaveBeenCalledWith(
        'report-1',
        'reviewer-1',
        'user-2',
        ReportStatusEnum.IN_REVIEW,
      )
    })

    it('unassigns an IN_REVIEW report and returns it to SUBMITTED', async () => {
      reportModel.update.mockResolvedValue([1])
      reportModel.findOne.mockResolvedValue({ reviewerUserId: 'user-1' })
      reportEventService.emitAssigned.mockResolvedValue(undefined)

      await service.assign(reviewerContext(ReportStatusEnum.IN_REVIEW), {
        userId: null,
      })

      expect(userModel.findOne).not.toHaveBeenCalled()
      expect(reportModel.update).toHaveBeenCalledWith(
        {
          status: ReportStatusEnum.SUBMITTED,
          reviewerUserId: null,
        },
        { where: { id: 'report-1' } },
      )
      expect(reportEventService.emitAssigned).toHaveBeenCalledWith(
        'report-1',
        'reviewer-1',
        null,
        ReportStatusEnum.SUBMITTED,
      )
    })

    it('is a no-op when reassigning to the same user with same status', async () => {
      reportModel.findOne.mockResolvedValue({ reviewerUserId: 'reviewer-1' })
      userModel.findOne.mockResolvedValue({
        id: 'reviewer-1',
        isActive: true,
      })

      await service.assign(reviewerContext(ReportStatusEnum.IN_REVIEW), {
        userId: 'reviewer-1',
      })

      expect(reportModel.update).not.toHaveBeenCalled()
      expect(reportEventService.emitAssigned).not.toHaveBeenCalled()
    })

    it('rejects when target user is inactive', async () => {
      reportModel.findOne.mockResolvedValue({ reviewerUserId: null })
      userModel.findOne.mockResolvedValue({ id: 'user-2', isActive: false })

      await expect(
        service.assign(reviewerContext(ReportStatusEnum.SUBMITTED), {
          userId: 'user-2',
        }),
      ).rejects.toBeInstanceOf(BadRequestException)

      expect(reportModel.update).not.toHaveBeenCalled()
    })

    it('rejects when target user does not exist', async () => {
      reportModel.findOne.mockResolvedValue({ reviewerUserId: null })
      userModel.findOne.mockResolvedValue(null)

      await expect(
        service.assign(reviewerContext(ReportStatusEnum.SUBMITTED), {
          userId: 'missing',
        }),
      ).rejects.toBeInstanceOf(BadRequestException)

      expect(reportModel.update).not.toHaveBeenCalled()
    })

    it('rejects unassign from SUBMITTED (nothing to unassign)', async () => {
      await expect(
        service.assign(reviewerContext(ReportStatusEnum.SUBMITTED), {
          userId: null,
        }),
      ).rejects.toBeInstanceOf(BadRequestException)

      expect(reportModel.update).not.toHaveBeenCalled()
    })

    it('rejects reports outside SUBMITTED / IN_REVIEW', async () => {
      await expect(
        service.assign(reviewerContext(ReportStatusEnum.DRAFT), {}),
      ).rejects.toBeInstanceOf(BadRequestException)

      expect(reportModel.update).not.toHaveBeenCalled()
    })

    it('rejects company actors', async () => {
      await expect(
        service.assign(companyContext(ReportStatusEnum.SUBMITTED), {}),
      ).rejects.toBeInstanceOf(ForbiddenException)

      expect(reportModel.update).not.toHaveBeenCalled()
    })
  })

  describe('deny', () => {
    it('transitions IN_REVIEW → DENIED with denial reason and emits STATUS_CHANGED', async () => {
      reportModel.update.mockResolvedValue([1])
      reportEventService.emitStatusChanged.mockResolvedValue(undefined)

      const dto: DenyReportDto = { denialReason: '  Missing data  ' }
      await service.deny(reviewerContext(ReportStatusEnum.IN_REVIEW), dto)

      expect(reportModel.update).toHaveBeenCalledWith(
        {
          status: ReportStatusEnum.DENIED,
          reviewerUserId: 'reviewer-1',
        },
        { where: { id: 'report-1' } },
      )
      expect(reportEventService.emitStatusChanged).toHaveBeenCalledWith(
        'report-1',
        ReportStatusEnum.IN_REVIEW,
        ReportStatusEnum.DENIED,
        'reviewer-1',
        'Missing data',
      )
    })

    it('rejects non-IN_REVIEW reports', async () => {
      await expect(
        service.deny(reviewerContext(ReportStatusEnum.SUBMITTED), {
          denialReason: 'reason',
        }),
      ).rejects.toBeInstanceOf(BadRequestException)

      expect(reportModel.update).not.toHaveBeenCalled()
    })

    it('rejects blank denial reason', async () => {
      await expect(
        service.deny(reviewerContext(ReportStatusEnum.IN_REVIEW), {
          denialReason: '   ',
        }),
      ).rejects.toBeInstanceOf(BadRequestException)

      expect(reportModel.update).not.toHaveBeenCalled()
    })

    it('rejects company actors', async () => {
      await expect(
        service.deny(companyContext(ReportStatusEnum.IN_REVIEW), {
          denialReason: 'reason',
        }),
      ).rejects.toBeInstanceOf(ForbiddenException)
    })
  })

  describe('approve', () => {
    it('transitions IN_REVIEW → APPROVED, supersedes prior approvals, emits STATUS_CHANGED + SUPERSEDED', async () => {
      reportModel.update.mockResolvedValue([1])
      reportModel.findAll.mockResolvedValue([{ id: 'old-report-1' }])
      reportEventService.emitStatusChanged.mockResolvedValue(undefined)
      reportEventService.emitSuperseded.mockResolvedValue(undefined)
      companyReportModel.findOne.mockResolvedValue({ companyId: 'company-1' })
      companyReportModel.findAll.mockResolvedValue([
        { reportId: 'old-report-1' },
        { reportId: 'report-1' },
      ])

      await service.approve(reviewerContext(ReportStatusEnum.IN_REVIEW))

      expect(reportModel.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: ReportStatusEnum.APPROVED,
          reviewerUserId: 'reviewer-1',
        }),
        { where: { id: 'report-1' } },
      )
      expect(reportModel.update).toHaveBeenCalledWith(
        { status: ReportStatusEnum.SUPERSEDED, validUntil: expect.any(Date) },
        { where: { id: ['old-report-1'] } },
      )
      expect(reportEventService.emitSuperseded).toHaveBeenCalledWith(
        'old-report-1',
        'report-1',
      )
      expect(reportEventService.emitStatusChanged).toHaveBeenCalledWith(
        'report-1',
        ReportStatusEnum.IN_REVIEW,
        ReportStatusEnum.APPROVED,
        'reviewer-1',
      )
    })

    it('skips supersede when no sibling reports are APPROVED', async () => {
      reportModel.update.mockResolvedValue([1])
      reportModel.findAll.mockResolvedValue([])
      reportEventService.emitStatusChanged.mockResolvedValue(undefined)
      companyReportModel.findOne.mockResolvedValue({ companyId: 'company-1' })
      companyReportModel.findAll.mockResolvedValue([{ reportId: 'report-1' }])

      await service.approve(reviewerContext(ReportStatusEnum.IN_REVIEW))

      expect(reportModel.update).toHaveBeenCalledTimes(1)
      expect(reportEventService.emitSuperseded).not.toHaveBeenCalled()
    })

    it('rejects non-IN_REVIEW reports', async () => {
      await expect(
        service.approve(reviewerContext(ReportStatusEnum.SUBMITTED)),
      ).rejects.toBeInstanceOf(BadRequestException)

      expect(reportModel.update).not.toHaveBeenCalled()
    })

    it('rejects company actors', async () => {
      await expect(
        service.approve(companyContext(ReportStatusEnum.IN_REVIEW)),
      ).rejects.toBeInstanceOf(ForbiddenException)
    })
  })

  describe('startFines', () => {
    it('stamps finesStartedAt on the report', async () => {
      reportModel.update.mockResolvedValue([1])

      await service.startFines(reviewerContext(ReportStatusEnum.IN_REVIEW))

      expect(reportModel.update).toHaveBeenCalledWith(
        { finesStartedAt: expect.any(Date) },
        { where: { id: 'report-1' } },
      )
    })

    it('rejects company actors', async () => {
      await expect(
        service.startFines(companyContext(ReportStatusEnum.IN_REVIEW)),
      ).rejects.toBeInstanceOf(ForbiddenException)
    })
  })
})
