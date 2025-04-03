import { SignatureType } from '@dmr.is/constants'

import { ApiProperty } from '@nestjs/swagger'

export class ApplicationMisc {
  @ApiProperty({
    enum: SignatureType,
  })
  signatureType?: SignatureType
}
