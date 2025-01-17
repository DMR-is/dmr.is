import { ApiProperty } from '@nestjs/swagger'

import { CaseDetailed } from './case.dto'

export class GetCaseResponse {
  @ApiProperty({
    type: CaseDetailed,
    required: true,
  })
  readonly case!: CaseDetailed
}
