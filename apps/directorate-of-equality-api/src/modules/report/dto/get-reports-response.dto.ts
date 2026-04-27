import { ApiProperty } from '@nestjs/swagger'

import { Paging } from '@dmr.is/shared-dto'

import { ReportListItemDto } from './report-list-item.dto'

export class GetReportsResponseDto {
  @ApiProperty({ type: [ReportListItemDto] })
  reports!: ReportListItemDto[]

  @ApiProperty({ type: Paging })
  paging!: Paging
}
