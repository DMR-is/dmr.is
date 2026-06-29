import { ReportTypeEnum } from '../report/models/report.enums'
import { AutoReviewDecisionEnum } from '../report/models/report-event.model'

export const IReportAutoReviewService = Symbol('IReportAutoReviewService')

/**
 * The raw inputs the verdict was reached from, snapshotted so a later analysis
 * can see *why* the system decided what it did without recomputing. Stored on
 * the verdict (not yet persisted as columns — `reason` carries the human
 * summary onto the event).
 */
export type AutoReviewSignals = {
  reportType: ReportTypeEnum
  totalEmployees: number
  outlierEmployees: number
  /** outlierEmployees / totalEmployees, or null when there are no employees. */
  outlierRatio: number | null
  /** Absolute male/female base-pay gap percent, or null when not computable. */
  gapPercent: number | null
  /** Same metric on the company's previous approved salary report, if any. */
  previousGapPercent: number | null
  /** Whether the gap shrank vs the previous report; null when no prior report. */
  gapImproved: boolean | null
}

export type AutoReviewVerdict = {
  decision: AutoReviewDecisionEnum
  /** Human-readable, admin-facing summary. Persisted on the event's `reason`. */
  reason: string
  signals: AutoReviewSignals
}

/**
 * Decides whether a freshly submitted report *would* be auto-approved. During
 * the soft phase the verdict is recorded for audit only and never changes the
 * report's status — see how the create flow consumes it. The decision rule is
 * intentionally isolated here so it can be swapped wholesale once the
 * directorate finalises the criteria.
 */
export interface IReportAutoReviewService {
  evaluate(reportId: string): Promise<AutoReviewVerdict>
}
