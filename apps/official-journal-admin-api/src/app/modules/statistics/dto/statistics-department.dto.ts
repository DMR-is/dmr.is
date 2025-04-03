import { ApiProperty } from '@nestjs/swagger'


class StatisticsStatusCount {
  @ApiProperty({
    type: String,
  })
  title!: string

  @ApiProperty({
    type: Number,
    description: 'Number of cases with status',
  })
  count!: number

  @ApiProperty({
    type: Number,
    description: 'Percentage of the total number of cases with status',
  })
  percentage!: number
}

export class GetStatisticsDepartmentResponse {
  @ApiProperty({
    type: [StatisticsStatusCount],
    description: 'List of case statuses with their respective counts',
  })
  statuses!: StatisticsStatusCount[]

  @ApiProperty({
    type: Number,
    description: 'Total number of cases',
  })
  total!: number
}
