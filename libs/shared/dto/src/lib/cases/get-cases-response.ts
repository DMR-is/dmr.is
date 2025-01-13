import { ApiProperty } from '@nestjs/swagger'

import { Paging } from '../paging/paging.dto'
import { CaseDetailed } from './case.dto'

export class GetCasesReponse {
  @ApiProperty({
    type: [CaseDetailed],
  })
  cases!: CaseDetailed[]

  @ApiProperty({
    description: 'Paging info',
    type: Paging,
  })
  paging!: Paging
}
