import { ApiProperty } from '@nestjs/swagger'

export class StatisticsDepartmentItem {
  @ApiProperty({
    description: 'Item title',
    example: 'Tilbúið',
    required: true,
    type: String,
  })
  name!: string

  @ApiProperty({
    description: 'Number of cases',
    example: 10,
    required: true,
    type: Number,
  })
  count!: number

  @ApiProperty({
    description: 'Percentage of total',
    example: 10,
    required: true,
    type: Number,
  })
  percentage!: number
}

export class StatisticsDepartmentData {
  @ApiProperty({
    type: StatisticsDepartmentItem,
    required: true,
  })
  submitted!: StatisticsDepartmentItem

  @ApiProperty({
    type: StatisticsDepartmentItem,
    required: true,
  })
  inProgress!: StatisticsDepartmentItem

  @ApiProperty({
    type: StatisticsDepartmentItem,
    required: true,
  })
  inReview!: StatisticsDepartmentItem

  @ApiProperty({
    type: StatisticsDepartmentItem,
    required: true,
  })
  ready!: StatisticsDepartmentItem
}

export class GetStatisticsDepartmentResponse {
  @ApiProperty({
    type: StatisticsDepartmentData,
    required: true,
  })
  data!: StatisticsDepartmentData

  @ApiProperty({
    description: 'Total number of cases',
    example: 100,
    required: true,
    type: Number,
  })
  totalCases!: number
}
