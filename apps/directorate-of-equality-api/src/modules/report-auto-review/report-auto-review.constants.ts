export const AUTO_REVIEW_LOGGING_CONTEXT = 'ReportAutoReviewService'

/**
 * SOFT PHASE SWITCH. While false, the system records what it *would* decide but
 * never acts on it — a human still reviews every report. Flipping this to true
 * (and wiring the `systemApprove` branch in the create flow) turns the audit
 * into real automation. Kept as a single constant so the flip is one edit.
 */
export const AUTO_REVIEW_ENFORCE = false

/**
 * PROVISIONAL auto-approve thresholds. The directorate has not finalised the
 * real criteria; these placeholders let the soft audit produce a verdict so we
 * can measure how the rule behaves on live submissions. Tune the values — or
 * replace the whole decision body in the service — once the formula is agreed.
 */
export const AUTO_REVIEW_THRESHOLDS = {
  /** Max share of a report's employees flagged as outliers, still approvable. */
  maxOutlierRatio: 0.1,
  /** Max absolute male/female base-pay gap percent, still approvable. */
  maxGapPercent: 5,
}
