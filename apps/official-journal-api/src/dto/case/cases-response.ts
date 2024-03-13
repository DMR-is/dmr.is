import { ApiProperty } from '@nestjs/swagger'
import { Case } from './case.dto'
import { JournalPaging } from '../journal-paging.dto'

export class CasesReponse {
  @ApiProperty({
    type: [Case],
  })
  cases!: Case[]

  @ApiProperty({
    description: 'Paging info',
    type: JournalPaging,
  })
  paging!: JournalPaging
}
