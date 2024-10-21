import { ApiProperty } from '@nestjs/swagger'

import { Paging } from '../paging/paging.dto'
import { Case } from './case.dto'
import { CaseInProgress } from './case-in-progress.dto'

export class GetCasesInProgressReponse {
  @ApiProperty({
    type: [Case],
  })
  cases!: CaseInProgress[]

  @ApiProperty({
    description: 'Paging info',
    type: Paging,
  })
  paging!: Paging
}
