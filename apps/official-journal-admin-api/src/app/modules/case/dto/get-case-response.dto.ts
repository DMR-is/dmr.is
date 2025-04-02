import { CaseDetailed } from '@dmr.is/official-journal/dto/case/case.dto'

import { ApiProperty } from '@nestjs/swagger'

export class GetCaseResponse {
  @ApiProperty({
    type: CaseDetailed,
    required: true,
  })
  readonly case!: CaseDetailed
}
