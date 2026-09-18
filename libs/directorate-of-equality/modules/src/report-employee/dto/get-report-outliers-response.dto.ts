import { ApiProperty } from '@nestjs/swagger'

import { Paging } from '@dmr.is/shared-dto'

import { ReportEmployeeOutlierDto } from './report-employee-outlier.dto'

/**
 * Paginated list of a single report's outliers. Used by both the admin
 * (`GET /reports/:id/outliers`) and applicant (`GET /application/reports/:providerId/outliers`)
 * endpoints — the shape is identical because the underlying row is the same.
 *
 * The endpoint was split out from the report-detail payload because a
 * single report can legitimately have hundreds of outliers, and the detail
 * view does not always need the full list (only a "do outliers exist"
 * indicator). Callers that just need the indicator should read
 * `includesImprovementPlan` from the detail response instead of paginating
 * an empty list.
 */
export class GetReportOutliersResponseDto {
  @ApiProperty({ type: [ReportEmployeeOutlierDto] })
  outliers!: ReportEmployeeOutlierDto[]

  @ApiProperty({ type: Paging })
  paging!: Paging
}
