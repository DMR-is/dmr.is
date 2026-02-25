import { Type } from 'class-transformer'
import { IsDate, IsNumber, IsOptional, IsUUID } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

import { Department, Paging, PagingQuery } from '@dmr.is/shared-dto'
export class IssueDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: Department })
  department!: Department

  @ApiProperty({ type: Date })
  startDate!: Date

  @ApiProperty({ type: Date })
  endDate!: Date

  @ApiProperty({ type: String })
  title!: string

  @ApiProperty({ type: String })
  formattedTitle!: string

  @ApiProperty({ type: String })
  url!: string
}

export class GetMonthlyIssuesQueryDto extends PagingQuery {
  @ApiProperty({ type: String, required: false })
  departmentId?: string

  @ApiProperty({ type: Number, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  month?: number

  @ApiProperty({ type: Number, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  year?: number
}

export class GetMonthlyIssuesResponseDto {
  @ApiProperty({ type: [IssueDto] })
  issues!: IssueDto[]

  @ApiProperty({ type: Paging })
  paging!: Paging
}

export class GenerateMonthlyIssuesQueryDto {
  @ApiProperty({ type: String })
  @IsUUID()
  departmentId!: string

  @ApiProperty({ type: String, format: 'date-time' })
  @Type(() => Date)
  @IsDate()
  date!: Date
}
