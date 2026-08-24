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
  /**
   * Whether the Oaxaca-Blinder unexplained term could be computed at all.
   *
   * ⚠️ **This is a fail-closed gate, not an informational flag.** `false` means
   * a human must look — see `decide()`. It is read from the frozen
   * decomposition, and `null` only when no result row exists yet.
   */
  oskyrtAvailable: boolean | null
  /**
   * Size of the frozen lágmarksmengi. Read off the SNAPSHOT, unlike
   * `outlierEmployees`, which is a row count from the create-path decomposition
   * and can disagree with it.
   */
  minimumSetSize: number | null
  /**
   * Whether the frozen set's correction would bring óskýrt within the benchmark.
   *
   * ⚠️ Required alongside `minimumSetSize` because an empty set does NOT imply
   * compliance: when nobody on the disadvantaged side is underpaid, there is
   * nothing to lift and the walk returns an empty set with `closesGap: false`.
   */
  minimumSetClosesGap: boolean | null
  /**
   * THE compliance input: `|óskýrt|` within the benchmark, off the frozen
   * snapshot. Null when the gap is not computable or when abstaining.
   *
   * ⚠️ Read this instead of `minimumSetSize === 0`. The two agreed while the
   * walk always committed its first candidate; they no longer do, because the
   * walk now declines a candidate that would push the gap further out. An empty
   * set on a non-compliant company is therefore reachable, and keying the
   * decision on size would auto-approve it.
   */
  oskyrtWithinBenchmark: boolean | null
  /**
   * LEIÐRÉTTUR launamunur — the figure the statutory benchmark tests, as a
   * magnitude. Recorded for the audit trail; **not yet a decision input**,
   * because `AUTO_REVIEW_THRESHOLDS` still carries values calibrated against the
   * retired ±band and the FTE-monthly gap. Wiring it is Phase 2.1.
   */
  adjustedGapPercent: number | null
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
