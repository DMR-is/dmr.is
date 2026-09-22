import {
  ReportProviderEnum,
  ReportStatusEnum,
  ReportTypeEnum,
} from '../report/models/report.model'
import { EqualityCoverage } from '../report/types/equality-coverage'
import { CreateReportCompanySnapshotDto } from '../report-create/dto/create-report.dto'

/**
 * How a new filing should treat a pending sibling.
 *
 * `SUBMITTED` is always withdrawn and replaced; `IN_REVIEW` always conflicts.
 * Only `POSTPONED` is negotiable, because only `POSTPONED` means two different
 * things depending on who filed it — a deliberate "explain later" on island.is,
 * or simply what a submission with unexplained outliers becomes on a channel
 * that cannot preview first.
 */
export interface WithdrawInflightSiblingOptions {
  /** Withdraw a `POSTPONED` sibling rather than answering `409`. */
  withdrawPostponed?: boolean

  /**
   * Restrict `withdrawPostponed` to siblings filed on this channel.
   *
   * Without it the flag is keyed on who is *filing* rather than on what is being
   * replaced, so a payroll vendor's submission would retire a `POSTPONED` report
   * the employer had deliberately deferred on island.is — with no signal to
   * either party, since the vendor cannot see that report and the employer used
   * to get a `409` naming it.
   *
   * `POSTPONED` means two different things depending on who filed it, so the
   * decision has to look at the sibling, not only at the caller.
   */
  providerType?: ReportProviderEnum
}

export interface IReportFinalizeService {
  resolveEqualityCoverage(companyId: string): Promise<EqualityCoverage>
  /**
   * Throws 404 unless `equalityReportId` is an APPROVED, in-force EQUALITY
   * report that covers `companyId`.
   *
   * `companyId` is the company the caller has already established as the
   * submitter — the owner of the draft in `ReportDraftSubmitService`, the
   * parent entry of the snapshot set in `ReportCreateService`. This method
   * cannot tell the two apart, so its guarantee is only as good as the
   * caller's: every path into `ReportCreateService` must build `companies[]`
   * server-side and never accept it from a request body.
   */
  assertEqualityReportApproved(
    equalityReportId: string,
    companyId: string,
  ): Promise<void>
  withdrawInflightSibling(
    companyId: string,
    type: ReportTypeEnum,
    options?: WithdrawInflightSiblingOptions,
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
