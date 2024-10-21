import { ApiProperty } from '@nestjs/swagger'

import { Paging } from '../paging/paging.dto'
import { CaseInProgress } from './case-in-progress.dto'

export class GetCasesInProgressReponse {
  @ApiProperty({
    type: [CaseInProgress],
  })
  cases!: CaseInProgress[]

  @ApiProperty({
    description: 'Paging info',
    type: Paging,
  })
  paging!: Paging
}
