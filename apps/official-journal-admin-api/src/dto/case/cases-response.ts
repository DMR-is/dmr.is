import { ApiProperty } from '@nestjs/swagger'
import { Case } from './case.dto'
import { Paging } from '@dmr.is/shared/dto/common'
export class CasesReponse {
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
