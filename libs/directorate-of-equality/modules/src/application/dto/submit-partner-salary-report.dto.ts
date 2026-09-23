import { IntersectionType, OmitType } from '@nestjs/swagger'

import { ParsedReportDto } from '../../report-excel/dto/parsed-report.dto'
import { PartnerSalaryPayloadFields } from '../../scoring-model/dto/submit-partner-salary.dto'
import { SubmitSalaryReportDto } from './submit-salary-report.dto'

/**
 * The partner API's salary submission.
 *
 * Two fields of the island.is contract are deliberately absent, and both for
 * the same reason: on this channel they are facts the server is in a better
 * position to know than the caller.
 *
 * - **`equalityReportId`** — there is exactly one answer a caller could give
 *   that the submission would accept, and the server already computes it
 *   (`findActiveEqualityForCompany`) one route earlier to answer
 *   `GET /reports/salary/eligibility`. Asking a vendor to fetch it and hand it
 *   back could only ever reproduce that value or produce a 404, and in practice
 *   produced the 404: the equality submission returns a `reportId`, the salary
 *   submission wants the report's own id, and nothing about the field names
 *   warns that these differ. Resolved server-side instead.
 * - **`importedFromExcel`** — this API replaces the workbook rather than
 *   transporting one, so there is no import path here to have come through. It
 *   is always `false` on this channel, and a caller-declared value would have
 *   been an unverifiable claim about a route that no longer exists: nothing
 *   validated it, nothing branched on it, and the back office displayed it as
 *   provenance.
 *
 * - **`parsed`** — the scoring payload, which on this channel is assembled from
 *   two things the caller *does* hold sensibly: `scoringModelId`, naming the
 *   company's stored starfsmat, and a flat `employees[]` payroll extract. The
 *   criteria tree, the þrep and the job step assignments never cross the wire:
 *   they are the employer's, unchanged since the last filing, and a payroll
 *   system does not hold them. The server expands the pair into the same
 *   `ParsedReportDto` every other channel submits, so nothing downstream knows
 *   a scoring model exists. See [[Directorate of Equality Scoring Model]].
 *
 * - **`outliersPostponed`** — the flag that says "file this with the
 *   explanations deferred". It asked the caller to state something it could not
 *   know: postponement depends on whether outliers were detected, and on this
 *   channel detection happens inside the submission it is a field of. A vendor
 *   setting it wrongly either had a clean payroll refused ("cannot postpone
 *   nothing") or an outlier refused for want of groups.
 *
 *   **Omitting the groups when outliers exist *is* the postpone**, so a flag
 *   saying so is redundant. Send groups and the report is `SUBMITTED`; send
 *   none and it lands `POSTPONED` with the ordinals still owed in the response.
 *   The old flag's other awkwardness goes with it: it was all-or-none, and it
 *   answered `400` when no outliers had been detected.
 *
 * `OmitType` rather than a hand-written class: the remaining twenty-odd fields
 * are the same contract island.is submits, and a copy would drift from it field
 * by field. What this surface subtracts is the whole statement here.
 */
export class SubmitPartnerSalaryReportDto extends IntersectionType(
  OmitType(SubmitSalaryReportDto, [
    'equalityReportId',
    'importedFromExcel',
    'parsed',
    'outliersPostponed',
  ] as const),
  PartnerSalaryPayloadFields,
) {}

/**
 * What `submitSalary` actually needs, which is neither wire contract exactly:
 * the shared fields, plus the two omitted ones as optional. Both channels'
 * DTOs are assignable to it — island.is supplies the pair, the partner API
 * leaves them for the service to resolve — so one service method still serves
 * both and the submission rules cannot fork per channel.
 */
export type SubmitSalaryReportInput = Omit<
  SubmitPartnerSalaryReportDto,
  'scoringModelId' | 'employees'
> & {
  equalityReportId?: string | null
  importedFromExcel?: boolean
  parsed: ParsedReportDto
  /**
   * Still here although the partner DTO no longer publishes it: island.is sends
   * it, having previewed and asked the applicant. The partner API leaves it
   * unset and passes `postponeUnexplainedOutliers` instead, which asks the same
   * question of a caller that could not have previewed.
   */
  outliersPostponed?: boolean
}

/**
 * How the calling channel handles outliers, as distinct from what the caller
 * sent.
 *
 * Neither of these is a field on either wire contract, and that is the point.
 * They describe the shape of the channel — whether it can preview before it
 * submits, and what a `POSTPONED` report means on it — which is knowledge the
 * app holds about itself, not a claim a request can make. A vendor cannot ask
 * for its outliers to be postponed; postponement is simply what happens on a
 * channel that files the payroll once.
 */
export interface SubmitEqualityOptions {
  /** The vendor client filing, recorded as `report.partner_client_id`. */
  partnerClientId?: string | null
}

export interface SubmitSalaryOptions extends SubmitEqualityOptions {
  /**
   * File `POSTPONED` when outliers are detected and no groups were supplied,
   * rather than refusing. For a channel with no preview step.
   */
  postponeUnexplainedOutliers?: boolean

  /**
   * Let this submission withdraw and replace a `POSTPONED` sibling instead of
   * colliding with it. For a channel where `POSTPONED` is what a submission
   * becomes rather than something the filer chose.
   */
  withdrawPostponedSibling?: boolean
}
