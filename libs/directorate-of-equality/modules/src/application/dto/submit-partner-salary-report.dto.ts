import { OmitType } from '@nestjs/swagger'

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
 * `OmitType` rather than a hand-written class: the remaining twenty-odd fields
 * are the same contract island.is submits, and a copy would drift from it field
 * by field. What this surface subtracts is the whole statement here.
 */
export class SubmitPartnerSalaryReportDto extends OmitType(
  SubmitSalaryReportDto,
  ['equalityReportId', 'importedFromExcel'] as const,
) {}

/**
 * What `submitSalary` actually needs, which is neither wire contract exactly:
 * the shared fields, plus the two omitted ones as optional. Both channels'
 * DTOs are assignable to it — island.is supplies the pair, the partner API
 * leaves them for the service to resolve — so one service method still serves
 * both and the submission rules cannot fork per channel.
 */
export type SubmitSalaryReportInput = SubmitPartnerSalaryReportDto & {
  equalityReportId?: string
  importedFromExcel?: boolean
}
