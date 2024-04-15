import { Type } from 'class-transformer'
import { IsArray, IsNumber, ValidateNested } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

export class StatisticsOverviewCategory {
  @ApiProperty({
    type: Number,
    required: true,
  })
  totalAdverts!: number

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
  totalAdverts!: number
}
