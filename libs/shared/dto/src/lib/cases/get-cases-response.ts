import { ApiProperty } from '@nestjs/swagger'

import { Paging } from '../paging/paging.dto'
import { Case } from './case.dto'

export class GetCasesReponse {
  @ApiProperty({
    type: [Case],
  })
  cases!: Case[]

  @ApiProperty({
    description: 'Paging info',
    type: Paging,
  })
  paging!: Paging
}
