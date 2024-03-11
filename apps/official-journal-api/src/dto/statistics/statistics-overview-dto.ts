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

export class StatisticsOverview {
  @ApiProperty({
    type: Number,
    required: true,
  })
  categories!: StatisticsOverviewCategory[]

  @ApiProperty({
    type: Number,
    required: true,
  })
  totalAdverts!: number
}
