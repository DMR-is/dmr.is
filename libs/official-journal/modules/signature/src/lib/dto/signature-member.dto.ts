import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger'
;/ */
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
