import { ApiProperty } from '@nestjs/swagger'

export class StatisticsDepartmentItem {
  @ApiProperty({
    description: 'Department name',
    example: 'Department of Justice',
    required: true,
    type: String,
  })
  name!: string

  @ApiProperty({
    description: 'Number of adverts',
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

export class StatisticsDepartmentResponse {
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

  @ApiProperty({
    description: 'Total number of adverts',
    example: 100,
    required: true,
    type: Number,
  })
  totalAdverts!: number

  @ApiProperty({
    description: 'Total number of departments',
    example: 10,
    required: true,
    type: Number,
  })
  totalPercentage!: number
}
