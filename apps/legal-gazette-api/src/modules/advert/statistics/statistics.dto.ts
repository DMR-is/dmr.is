import { IsNumber } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

export class GetAdvertsInProgressStatsDto {
  @ApiProperty({ type: Number })
  @IsNumber()
  unassignedCount!: number

  @ApiProperty({ type: Number })
  @IsNumber()
  withCommentsCount!: number

  @ApiProperty({ type: Number })
  @IsNumber()
  submittedTodayCount!: number

  @ApiProperty({ type: Number })
  @IsNumber()
  totalInProgressCount!: number
}

export class GetAdvertsToBePublishedStatsDto {
  @ApiProperty({ type: Number })
  @IsNumber()
  tobePublishedTodayCount!: number

  @ApiProperty({ type: Number })
  @IsNumber()
  pastDueCount!: number
}

export class GetCountByStatusesDto {
  @ApiProperty({ type: Number })
  @IsNumber()
  submittedCount!: number

  @ApiProperty({ type: Number })
  @IsNumber()
  inprogressCount!: number

  @ApiProperty({ type: Number })
  @IsNumber()
  tobePublishedCount!: number
}
