import { ApiProperty } from '@nestjs/swagger'

import { Paging } from '../paging/paging.dto'
import { Case } from './case.dto'

class CaseOverviewTotalItems {
  @ApiProperty({
    type: Number,
    description: 'Total submitted cases',
    required: true,
    example: 7,
  })
  submitted!: number

  @ApiProperty({
    type: Number,
    description: 'Total in progress cases',
    required: true,
    example: 3,
  })
  inProgress!: number

  @ApiProperty({
    type: Number,
    description: 'Total in review cases',
    required: true,
    example: 2,
  })
  inReview!: number

  @ApiProperty({
    type: Number,
    description: 'Total ready cases',
    required: true,
    example: 1,
  })
  ready!: number
}

export class CaseEditorialOverview {
  @ApiProperty({
    type: [Case],
    description: 'Cases for selected tab',
    required: true,
  })
  data!: Case[]

  @ApiProperty({
    type: CaseOverviewTotalItems,
    description: 'Total cases for each status',
    required: true,
  })
  totalItems!: CaseOverviewTotalItems

  @ApiProperty({
    type: Paging,
    description: 'Paging information',
    required: true,
  })
  paging!: Paging
}
