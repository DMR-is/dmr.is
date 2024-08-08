import { ApiProperty } from '@nestjs/swagger'

import { CaseWithAdvert } from './case-with-advert.dto'

export class GetCaseResponse {
  @ApiProperty({
    type: CaseWithAdvert,
    required: true,
  })
  readonly case!: CaseWithAdvert
}
