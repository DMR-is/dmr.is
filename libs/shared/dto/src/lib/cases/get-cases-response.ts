import { ApiProperty } from '@nestjs/swagger'
import { Case } from './case.dto'
import { Paging } from '../paging/paging.dto'

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
