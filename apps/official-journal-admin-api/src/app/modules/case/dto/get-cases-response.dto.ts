import { Case } from '@dmr.is/official-journal/dto/case/case.dto'
import { Paging } from '@dmr.is/shared/dto'

import { ApiProperty } from '@nestjs/swagger'

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
