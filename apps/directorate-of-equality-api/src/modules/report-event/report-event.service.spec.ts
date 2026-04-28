import { ReportEventTypeEnum } from '../report/models/report-event.model'
import { ReportStatusEnum } from '../report/models/report.model'
import { ReportEventService } from './report-event.service'

describe('ReportEventService', () => {
  const logger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }

  const reportEventModel = {
    create: jest.fn(),
  }

  let service: ReportEventService

  beforeEach(() => {
    jest.clearAllMocks()
    service = new ReportEventService(logger as never, reportEventModel as never)
  })

  describe('emitSubmitted', () => {
    it('creates a SUBMITTED event with null actor and company reference', async () => {
      reportEventModel.create.mockResolvedValue({})

      await service.emitSubmitted('report-1', 'company-1')

      expect(reportEventModel.create).toHaveBeenCalledWith({
        reportId: 'report-1',
        eventType: ReportEventTypeEnum.SUBMITTED,
        actorUserId: null,
        reportStatus: ReportStatusEnum.SUBMITTED,
        companyId: 'company-1',
      })
    })
  })

  describe('emitAssigned', () => {
    it('creates an ASSIGNED event with IN_REVIEW status snapshot', async () => {
      reportEventModel.create.mockResolvedValue({})

      await service.emitAssigned('report-1', 'reviewer-1', 'reviewer-1')

      expect(reportEventModel.create).toHaveBeenCalledWith({
        reportId: 'report-1',
        eventType: ReportEventTypeEnum.ASSIGNED,
        actorUserId: 'reviewer-1',
        reportStatus: ReportStatusEnum.IN_REVIEW,
        assignedUserId: 'reviewer-1',
      })
    })
  })

  describe('emitStatusChanged', () => {
    it('creates a STATUS_CHANGED event with toStatus as the snapshot', async () => {
      reportEventModel.create.mockResolvedValue({})

      await service.emitStatusChanged(
        'report-1',
        ReportStatusEnum.IN_REVIEW,
        ReportStatusEnum.APPROVED,
        'reviewer-1',
      )

      expect(reportEventModel.create).toHaveBeenCalledWith({
        reportId: 'report-1',
        eventType: ReportEventTypeEnum.STATUS_CHANGED,
        actorUserId: 'reviewer-1',
        reportStatus: ReportStatusEnum.APPROVED,
        fromStatus: ReportStatusEnum.IN_REVIEW,
        toStatus: ReportStatusEnum.APPROVED,
        reason: null,
      })
    })

    it('includes denial reason when provided', async () => {
      reportEventModel.create.mockResolvedValue({})

      await service.emitStatusChanged(
        'report-1',
        ReportStatusEnum.IN_REVIEW,
        ReportStatusEnum.DENIED,
        'reviewer-1',
        'Missing required documents',
      )

      expect(reportEventModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          reason: 'Missing required documents',
          toStatus: ReportStatusEnum.DENIED,
        }),
      )
    })

    it('defaults actorUserId and reason to null when omitted', async () => {
      reportEventModel.create.mockResolvedValue({})

      await service.emitStatusChanged(
        'report-1',
        ReportStatusEnum.DRAFT,
        ReportStatusEnum.SUBMITTED,
      )

      expect(reportEventModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ actorUserId: null, reason: null }),
      )
    })
  })

  describe('emitSuperseded', () => {
    it('creates a SUPERSEDED event linking to the new report', async () => {
      reportEventModel.create.mockResolvedValue({})

      await service.emitSuperseded('old-report-1', 'new-report-1')

      expect(reportEventModel.create).toHaveBeenCalledWith({
        reportId: 'old-report-1',
        eventType: ReportEventTypeEnum.SUPERSEDED,
        actorUserId: null,
        reportStatus: ReportStatusEnum.SUPERSEDED,
        relatedReportId: 'new-report-1',
      })
    })
  })
})
