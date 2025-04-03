import { Signature } from '@dmr.is/official-journal/dto/signature/signature.dto'
import { ApiProperty } from '@nestjs/swagger'

export class GetSignature {
  @ApiProperty({
    type: Signature,
  })
  signature!: Signature
}
