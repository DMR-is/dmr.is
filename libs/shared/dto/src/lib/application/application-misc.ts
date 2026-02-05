import { ApiProperty } from '@nestjs/swagger'

import { SignatureType } from '@dmr.is/constants'

export class ApplicationMisc {
  @ApiProperty({
    enum: SignatureType,
  })
  signatureType?: SignatureType
}
