import { ApiProperty } from '@nestjs/swagger'
import { IsEnum } from 'class-validator'

export enum StatisticsOverviewQueryType {
  General = 'general',
  Personal = 'personal',
  Inactive = 'inactive',
  Publishing = 'publishing',
}

export class StatisticsOverviewQuery {
  @ApiProperty({
    enum: StatisticsOverviewQueryType,
    example: StatisticsOverviewQueryType.General,
  })
  @IsEnum(StatisticsOverviewQueryType)
  type!: StatisticsOverviewQueryType
}
