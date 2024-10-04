import { ApiProperty } from '@nestjs/swagger'

import { Paging } from '../paging/paging.dto'
import { Case } from './case.dto'

class PublishedCasesTotalItems {
  @ApiProperty({
    name: 'a',
    type: Number,
  })
  a!: number

  @ApiProperty({
    name: 'b',
    type: Number,
  })
  b!: number

  @ApiProperty({
    name: 'c',
    type: Number,
  })
  c!: number
}

export class GetPublishedCasesResponse {
  @ApiProperty({
    type: [Case],
  })
  cases!: Case[]

  @ApiProperty({
    description: 'Total items',
    type: PublishedCasesTotalItems,
  })
  totalItems!: PublishedCasesTotalItems

  @ApiProperty({
    description: 'Paging info',
    type: Paging,
  })
  paging!: Paging
}
