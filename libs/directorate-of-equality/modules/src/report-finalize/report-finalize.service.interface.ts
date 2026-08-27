import { ReportStatusEnum, ReportTypeEnum } from '../report/models/report.model'
import { CreateReportCompanySnapshotDto } from '../report-create/dto/create-report.dto'

export interface IReportFinalizeService {
  assertEqualityReportApproved(equalityReportId: string): Promise<void>
  withdrawInflightSibling(
    companyId: string,
    type: ReportTypeEnum,
  ): Promise<string[]>
  emitWithdrawnEvents(
    withdrawnReportIds: string[],
    replacingReportId: string,
  ): Promise<void>
  createCompanyReportSnapshots(
    reportId: string,
    companies: CreateReportCompanySnapshotDto[],
  ): Promise<void>
  recordAutoReview(
    reportId: string,
    reportStatus: ReportStatusEnum,
    companyId: string,
  ): Promise<void>
  emitSubmittedEvent(
    reportId: string,
    reportStatus: ReportStatusEnum,
    companyId: string,
  ): Promise<void>
}

export const IReportFinalizeService = Symbol('IReportFinalizeService')
