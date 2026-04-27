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
    findAll: jest.fn(),
  }

  const companyReportModel = {
    findOne: jest.fn(),
    findAll: jest.fn(),
  }

  const sequelize = {
    transaction: jest
      .fn()
      .mockImplementation((cb: () => Promise<void>) => cb()),
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
      sequelize as never,
    )
  })

  describe('assign', () => {
    it('transitions SUBMITTED → IN_REVIEW and emits STATUS_CHANGED + ASSIGNED', async () => {
      reportModel.update.mockResolvedValue([1])
      reportEventService.emitStatusChanged.mockResolvedValue(undefined)
      reportEventService.emitAssigned.mockResolvedValue(undefined)

      await service.assign(reviewerContext(ReportStatusEnum.SUBMITTED))

      expect(reportModel.update).toHaveBeenCalledWith(
        { status: ReportStatusEnum.IN_REVIEW },
        { where: { id: 'report-1' } },
      )
      expect(reportEventService.emitAssigned).toHaveBeenCalledWith(
        'report-1',
        'reviewer-1',
        'reviewer-1',
      )
      expect(reportEventService.emitStatusChanged).not.toHaveBeenCalled()
    })

    it('rejects non-SUBMITTED reports', async () => {
      await expect(
        service.assign(reviewerContext(ReportStatusEnum.DRAFT)),
      ).rejects.toBeInstanceOf(BadRequestException)

      expect(reportModel.update).not.toHaveBeenCalled()
    })

    it('rejects company actors', async () => {
      await expect(
        service.assign(companyContext(ReportStatusEnum.SUBMITTED)),
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
