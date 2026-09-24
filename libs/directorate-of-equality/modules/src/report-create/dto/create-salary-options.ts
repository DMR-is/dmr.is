/**
 * How the calling channel handles outliers — passed beside the body, never in
 * it.
 *
 * These describe the shape of the channel: whether it can preview before it
 * submits, and what a `POSTPONED` report means on it. That is knowledge the
 * *app* holds about itself, not a claim a request gets to make. A caller must
 * not be able to ask for its unexplained outliers to be postponed, or for
 * someone's postponed report to be retired, by adding a field to a JSON body.
 *
 * ⚠️ **They were fields on `CreateReportDto` first, and that was wrong.** That
 * DTO is the `@Body()` of `POST /api/v1/reports/salary`, so declaring them there
 * published both as validated, settable request fields on the island.is surface
 * — where any authenticated applicant could have sent
 * `withdrawPostponedSibling: true` and retired their own deliberate
 * postponement, or `postponeUnexplainedOutliers: true` and filed `POSTPONED`
 * where the service means to answer `400`. Same company only, so not a
 * cross-tenant hole, but the design's central claim was false on the one surface
 * nothing pinned. A separate argument makes it true by construction rather than
 * by assertion.
 */
export interface ReportProvenanceOptions {
  /**
   * The vendor client whose credential filed the report, stored as
   * `report.partner_client_id`. Set by the partner API from the verified key,
   * never taken from a request — the same reasoning as every option here.
   */
  partnerClientId?: string | null
}

/** Equality filings carry provenance and nothing else channel-specific. */
export type CreateEqualityOptions = ReportProvenanceOptions

export interface CreateSalaryOptions extends ReportProvenanceOptions {
  /**
   * File `POSTPONED` when outliers are detected and no groups were supplied,
   * rather than refusing. For a channel with no preview step.
   */
  postponeUnexplainedOutliers?: boolean

  /**
   * Let this submission withdraw and replace a `POSTPONED` sibling **filed on
   * the same channel** instead of colliding with it. For a channel where
   * `POSTPONED` is what a submission becomes rather than something the filer
   * chose.
   */
  withdrawPostponedSibling?: boolean
}
