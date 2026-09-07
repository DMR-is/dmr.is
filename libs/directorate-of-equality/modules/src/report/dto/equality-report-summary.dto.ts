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
   * The submission handle **as the calling channel knows it**, and the value
   * that channel's `GET .../reports/:providerId` resolves against: the
   * island.is application UUID on island.is, the vendor's own id on the partner
   * API (the stored value is namespaced by company; the namespace is stripped
   * here and never exposed).
   *
   * `null` when the report cannot be reached from the calling channel — an
   * admin- or Excel-created report, or one filed on a different channel — in
   * which case no content route can reach it and a handle would only 404.
   *
   * Resolved by `ReportProviderChannel.toClientProviderId`, never read off the
   * row.
   */
  @ApiOptionalString({ nullable: true })
  providerId!: string | null

  @ApiOptionalDateTime({ nullable: true })
  approvedAt!: Date | null

  @ApiOptionalDateTime({ nullable: true })
  validUntil!: Date | null
}
