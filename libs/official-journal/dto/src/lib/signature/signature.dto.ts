import { ApiProperty, OmitType, PartialType, PickType } from '@nestjs/swagger'
import { InstitutionDto } from '../institution/institution.dto'
export class SignatureMember {
  @ApiProperty({
    type: String,
    required: true,
    description: 'The id of the signature member',
  })
  id!: string
  @ApiProperty({
    type: String,
    required: true,
    description: 'The name/title/w.e. of the signature member',
  })
  name!: string

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'The text comes above the signature name',
  })
  textAbove!: string | null

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'The text that comes before the signature name',
  })
  textBefore!: string | null

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'The text that comes below the signature name',
  })
  textBelow!: string | null

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'The text that comes after the signature name',
  })
  textAfter!: string | null
}

export class CreateSignatureMember extends OmitType(SignatureMember, [
  'id',
] as const) {}

export class UpdateSignatureMember extends PartialType(
  OmitType(SignatureMember, ['id'] as const),
) {}

export class SignatureRecord {
  @ApiProperty({
    type: String,
  })
  id!: string

  @ApiProperty({
    type: String,
  })
  institution!: string

  @ApiProperty({
    type: String,
  })
  signatureDate!: string

  @ApiProperty({
    type: String,
    nullable: true,
  })
  additional!: string | null

  @ApiProperty({
    type: SignatureMember,
    nullable: true,
  })
  chairman!: SignatureMember | null

  @ApiProperty({
    type: [SignatureMember],
  })
  members!: SignatureMember[]
}

export class CreateSignatureRecord {
  @ApiProperty({
    type: String,
    required: true,
  })
  institution!: string

  @ApiProperty({
    type: String,
    required: true,
  })
  signatureDate!: string

  @ApiProperty({
    type: String,
    required: false,
  })
  additional?: string

  @ApiProperty({
    type: CreateSignatureMember,
    required: false,
  })
  chairman?: CreateSignatureMember

  @ApiProperty({
    type: [CreateSignatureMember],
    required: true,
  })
  members!: CreateSignatureMember[]
}

export class UpdateSignatureRecord extends PartialType(
  PickType(CreateSignatureRecord, [
    'institution',
    'signatureDate',
    'additional',
  ]),
) {}

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
    type: InstitutionDto,
    description: 'The involved party of the signature',
    required: true,
  })
  involvedParty!: InstitutionDto

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
