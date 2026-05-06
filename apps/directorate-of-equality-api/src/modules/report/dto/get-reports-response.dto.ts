import { ApiProperty } from '@nestjs/swagger'

import { Paging } from '@dmr.is/shared-dto'

import { ReportListItemDto } from './report-list-item.dto'

export class ReportStatusCountsDto {
  @ApiProperty()
  submitted!: number

  @ApiProperty()
  inReview!: number

  @ApiProperty()
  processed!: number
}

export class GetReportsResponseDto {
  @ApiProperty({ type: [ReportListItemDto] })
  reports!: ReportListItemDto[]

  @ApiProperty({ type: Paging })
  paging!: Paging

  @ApiProperty({ type: ReportStatusCountsDto })
  statusCounts!: ReportStatusCountsDto
}
