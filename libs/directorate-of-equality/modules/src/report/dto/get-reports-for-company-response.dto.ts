import { ApiProperty } from '@nestjs/swagger'

import { Paging } from '@dmr.is/shared-dto'

import { ReportListItemDto } from './report-list-item.dto'

/**
 * Response for the company-detail reports tab. Deliberately leaner than
 * `GetReportsResponseDto` — no `statusCounts`, because this view is a flat
 * list of one company's reports, not the admin `/yfirlit` work queue with its
 * per-status tab counts.
 */
export class GetReportsForCompanyResponseDto {
  @ApiProperty({ type: [ReportListItemDto] })
  reports!: ReportListItemDto[]

  @ApiProperty({ type: Paging })
  paging!: Paging
}
