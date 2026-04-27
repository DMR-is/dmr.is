import {
  ApiEnum,
  ApiOptionalDateTime,
  ApiOptionalString,
  ApiUUId,
} from '@dmr.is/decorators'

import { ReportStatusEnum } from '../models/report.enums'

/**
 * Equality content always returned in a report detail view.
 *
 * Equality is the **root submission** every company makes — before any
 * salary report exists, the equality report is already there. When an
 * admin opens any report detail (equality or salary), the UI always shows
 * equality content. This DTO is the uniform shape for that content,
 * regardless of which report the admin requested:
 *
 * - Detail of an EQUALITY report → this block mirrors the requested
 *   report itself (same id/identifier/status/content).
 * - Detail of a SALARY report   → this block is loaded from the linked
 *   equality report (via `report.equalityReportId`). If that link is
 *   missing on a salary report, it's a data-integrity violation and the
 *   service throws — the domain invariant is "no salary without equality".
 */
export class EqualityReportDto {
  @ApiUUId()
  id!: string

  @ApiOptionalString({ nullable: true })
  identifier!: string | null

  @ApiEnum(ReportStatusEnum, { enumName: 'ReportStatusEnum' })
  status!: ReportStatusEnum

  @ApiOptionalString({ nullable: true })
  content!: string | null

  @ApiOptionalDateTime({ nullable: true })
  approvedAt!: Date | null

  @ApiOptionalDateTime({ nullable: true })
  validUntil!: Date | null

  @ApiOptionalDateTime({ nullable: true })
  correctionDeadline!: Date | null
}
