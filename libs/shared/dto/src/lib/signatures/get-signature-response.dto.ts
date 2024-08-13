import { ApiProperty } from '@nestjs/swagger'

import { Signature } from './signature.dto'

export class GetSignatureResponse {
  @ApiProperty({
    type: Signature,
    description: 'The signature',
    required: true,
  })
  signature!: Signature
}
