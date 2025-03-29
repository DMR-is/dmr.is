import { Paging } from '@dmr.is/shared/dto'

import { ApiProperty } from '@nestjs/swagger'
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
