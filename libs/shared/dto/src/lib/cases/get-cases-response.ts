import { ApiProperty } from '@nestjs/swagger'

import { Paging } from '../paging/paging.dto'
import { CaseWithAdvert } from './case-with-application.dto'

export class GetCasesReponse {
  @ApiProperty({
    type: [CaseWithAdvert],
  })
  cases!: CaseWithAdvert[]

  @ApiProperty({
    description: 'Paging info',
    type: Paging,
  })
  paging!: Paging
}
