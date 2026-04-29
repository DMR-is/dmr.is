import {
  ApiOptionalDateTime,
  ApiOptionalString,
  ApiUUId,
} from '@dmr.is/decorators'

/**
 * Slim view of an APPROVED equality report. Returned by
 * `GET application/reports/equality/active` so the application portal can
 * reference the right `equalityReportId` when submitting a salary report.
 *
 * Distinct from `EqualityReportDto` — the application caller doesn't need
 * the narrative `content` or `correctionDeadline` here; status is implied
 * (APPROVED) by the filter.
 */
export class EqualityReportSummaryDto {
  @ApiUUId()
  id!: string

  @ApiOptionalString({ nullable: true })
  identifier!: string | null

  @ApiOptionalDateTime({ nullable: true })
  approvedAt!: Date | null

  @ApiOptionalDateTime({ nullable: true })
  validUntil!: Date | null
}
