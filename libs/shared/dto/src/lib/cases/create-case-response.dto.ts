import { ApiProperty } from '@nestjs/swagger'

import { Case } from './case.dto'

export class CreateCaseResponse {
  @ApiProperty({
    type: Case,
    required: true,
  })
  readonly case!: Case
}
