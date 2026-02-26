import { Type } from 'class-transformer'
import {
  IsNumber,
  IsOptional,
} from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

import { Paging, PagingQuery } from '@dmr.is/shared-dto'

import { IssueDto } from '../../../../models/issues.model'

export class GetIssuesDto {
  @ApiProperty({
    type: [IssueDto],
  })
  issues!: IssueDto[]

  @ApiProperty({ type: Paging })
  paging!: Paging
}

export class GetIssuesQuery extends PagingQuery {
  @ApiProperty({ type: String, required: false, format: 'date-time' })
  dateFrom?: Date

  @ApiProperty({ type: String, required: false, format: 'date-time' })
  dateTo?: Date

  @ApiProperty({ type: Number, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  year?: number
}
