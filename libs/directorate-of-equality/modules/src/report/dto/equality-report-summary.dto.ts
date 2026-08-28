import {
  ApiOptionalDateTime,
  ApiOptionalString,
  ApiUUId,
} from '@dmr.is/decorators'

/**
 * Slim view of an APPROVED equality report. Returned to application callers so
 * they can reference the right `equalityReportId` when submitting a salary
 * report, and so they can fetch the report itself via `providerId`.
 *
 * Distinct from `EqualityReportDto` because callers do not need the narrative
 * `content` or `correctionDeadline` here; status is implied by the filter.
 */
export class EqualityReportSummaryDto {
  /**
   * The DoE-side primary key. Pass it back as `equalityReportId` when
   * submitting a salary report. It is *not* a lookup handle for application
   * callers — the only route keyed by it, `GET /reports/:id`, is admin-only.
   */
  @ApiUUId()
  id!: string

  /**
   * Short display code (e.g. `KTPQZW`) shown to humans in mail and support
   * tickets. Not a lookup handle either.
   */
  @ApiOptionalString({ nullable: true })
  identifier!: string | null

  /**
   * Upstream submission handle — the island.is application UUID this report
   * was created from, and the value `GET /application/reports/:providerId`
   * resolves against. `null` when the report did not originate on island.is
   * (an admin- or Excel-created report), in which case no applicant-facing
   * content route can reach it.
   */
  @ApiOptionalString({ nullable: true })
  providerId!: string | null

  @ApiOptionalDateTime({ nullable: true })
  approvedAt!: Date | null

  @ApiOptionalDateTime({ nullable: true })
  validUntil!: Date | null
}
