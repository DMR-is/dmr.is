import { ReportStatusEnum } from '../report/models/report.model'

export interface IReportEventService {
  emitSubmitted(reportId: string, companyId: string): Promise<void>
  emitAssigned(
    reportId: string,
    actorUserId: string,
    assignedUserId: string,
  ): Promise<void>
  emitStatusChanged(
    reportId: string,
    fromStatus: ReportStatusEnum,
    toStatus: ReportStatusEnum,
    actorUserId?: string | null,
    reason?: string | null,
  ): Promise<void>
  emitSuperseded(reportId: string, relatedReportId: string): Promise<void>
}

export const IReportEventService = Symbol('IReportEventService')
