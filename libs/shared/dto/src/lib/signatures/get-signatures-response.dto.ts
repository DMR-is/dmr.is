import { ApiProperty } from '@nestjs/swagger'

import { Paging } from '../paging'
import { Signature } from './signature.dto'

export class GetSignaturesResponse {
  @ApiProperty({
    type: [Signature],
  })
  signatures!: Signature[]

  @ApiProperty({
    type: Paging,
    required: true,
  })
  paging!: Paging
}
