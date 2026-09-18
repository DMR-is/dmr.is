import { ReportStatusEnum, ReportTypeEnum } from '../report/models/report.model'
import { EqualityCoverage } from '../report/types/equality-coverage'
import { CreateReportCompanySnapshotDto } from '../report-create/dto/create-report.dto'

export interface IReportFinalizeService {
  resolveEqualityCoverage(companyId: string): Promise<EqualityCoverage>
  /**
   * Throws 404 unless `equalityReportId` is an APPROVED, in-force EQUALITY
   * report that covers `companyId` — the authenticated submitter, never a value
   * taken from the payload.
   */
  assertEqualityReportApproved(
    equalityReportId: string,
    companyId: string,
  ): Promise<void>
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
