import { Type } from 'class-transformer'
import { IsArray, IsNumber, ValidateNested } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'


export class StatisticsOverviewCategory {
  @ApiProperty({
    type: Number,
    required: true,
  })
  count!: number

  @ApiProperty({
    type: String,
    required: true,
  })
  text!: string
}

export class GetStatisticsOverviewResponse {
  @ApiProperty({
    type: [StatisticsOverviewCategory],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StatisticsOverviewCategory)
  categories!: StatisticsOverviewCategory[]

  @ApiProperty({
    type: Number,
    required: true,
  })
  @IsNumber()
  total!: number
}

export class GetStatisticOverviewDashboardItem {
  @ApiProperty({
    type: String,
  })
  overviewType!: string
  @ApiProperty({
    type: GetStatisticsOverviewResponse,
  })
  @ValidateNested({ each: true })
  @Type(() => GetStatisticsOverviewResponse)
  overview!: GetStatisticsOverviewResponse
}

export class GetStatisticOverviewDashboardResponse {
  @ApiProperty({
    type: [GetStatisticOverviewDashboardItem],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GetStatisticOverviewDashboardItem)
  items!: GetStatisticOverviewDashboardItem[]
}
