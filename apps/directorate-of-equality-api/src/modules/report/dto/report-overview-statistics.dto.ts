import { ApiProperty } from '@nestjs/swagger'

import { ReportStatusEnum } from '../models/report.enums'

export class ReportStatisticsItemDto {
  @ApiProperty({ enum: ReportStatusEnum })
  status!: ReportStatusEnum

  @ApiProperty()
  count!: number

  @ApiProperty()
  percentage!: number
}

export class ReportStatisticsWindowDto {
  @ApiProperty({ type: [ReportStatisticsItemDto] })
  items!: ReportStatisticsItemDto[]

  @ApiProperty()
  total!: number
}

export class ReportOverviewStatisticsDto {
  @ApiProperty({ type: ReportStatisticsWindowDto })
  last30Days!: ReportStatisticsWindowDto

  @ApiProperty({ type: ReportStatisticsWindowDto })
  currentYear!: ReportStatisticsWindowDto

  @ApiProperty({ type: ReportStatisticsWindowDto })
  allTime!: ReportStatisticsWindowDto
}
