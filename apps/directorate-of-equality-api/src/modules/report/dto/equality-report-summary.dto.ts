import {
  ApiOptionalDateTime,
  ApiOptionalString,
  ApiUUId,
} from '@dmr.is/decorators'

/**
 * Slim view of an APPROVED equality report. Returned to application callers so
 * they can reference the right `equalityReportId` when submitting a salary
 * report.
 *
 * Distinct from `EqualityReportDto` because callers do not need the narrative
 * `content` or `correctionDeadline` here; status is implied by the filter.
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
