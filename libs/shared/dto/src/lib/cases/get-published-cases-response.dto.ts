import { ApiProperty } from '@nestjs/swagger'

import { Paging } from '../paging/paging.dto'
import { CaseOverview } from './case-editorial-overview.dto'

export class PublishedCasesCounter {
  @ApiProperty({
    name: 'department',
    type: String,
  })
  department!: string

  @ApiProperty({
    type: Number,
    name: 'count',
  })
  count!: number
}

export class GetPublishedCasesResponse {
  @ApiProperty({
    type: [PublishedCasesCounter],
    name: 'counter',
  })
  counter!: PublishedCasesCounter[]

  @ApiProperty({
    type: [CaseOverview],
    name: 'cases',
  })
  cases!: CaseOverview[]

  @ApiProperty({
    description: 'Paging info',
    type: Paging,
  })
  paging!: Paging
}
