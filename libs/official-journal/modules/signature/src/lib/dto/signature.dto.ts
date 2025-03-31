import { ApiProperty } from '@nestjs/swagger'

import { CreateSignatureRecord, SignatureRecord } from './signature-record.dto'
import { Institution } from '@dmr.is/official-journal/dto'

export class Signature {
  @ApiProperty({
    type: String,
    description: 'The id of the signature',
    required: true,
  })
  id!: string

  @ApiProperty({
    type: String,
    description: 'ISO datestring of the signature',
    required: true,
  })
  signatureDate!: string

  @ApiProperty({
    type: Institution,
    description: 'The involved party of the signature',
    required: true,
  })
  involvedParty!: Institution

  @ApiProperty({
    type: String,
    description: 'HTML of the signature',
    required: true,
  })
  html!: string

  @ApiProperty({
    type: String,
    description: 'ISO datestring of the creation date',
  })
  created!: string

  @ApiProperty({
    type: [SignatureRecord],
    description: 'The signature record',
    required: true,
  })
  records!: SignatureRecord[]
}

export class CreateSignature {
  @ApiProperty({
    type: String,
    description: 'The involved party of the signature',
    required: true,
  })
  involvedPartyId!: string

  @ApiProperty({
    type: [CreateSignatureRecord],
    description: 'The signature records',
  })
  records!: CreateSignatureRecord[]
}

export class GetSignature {
  @ApiProperty({
    type: Signature,
  })
  signature!: Signature
}

export class GetSignatures {
  @ApiProperty({
    type: [Signature],
  })
  signatures!: Signature[]
}
