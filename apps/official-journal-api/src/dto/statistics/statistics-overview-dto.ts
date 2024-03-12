import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsArray, IsNumber, ValidateNested } from 'class-validator'

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

export class StatisticsOverviewResponse {
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
