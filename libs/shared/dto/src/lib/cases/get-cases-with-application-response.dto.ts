import { ApiProperty } from '@nestjs/swagger'

import { Paging } from '../paging/paging.dto'
import { CaseWithApplication } from './case-with-application.dto'

export class GetCasesWithApplicationReponse {
  @ApiProperty({
    type: [CaseWithApplication],
  })
  cases!: CaseWithApplication[]

  @ApiProperty({
    description: 'Paging info',
    type: Paging,
  })
  paging!: Paging
}
