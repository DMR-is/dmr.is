import { ApiProperty } from '@nestjs/swagger'

export class SignatureType {
  @ApiProperty({
    type: 'string',
    description: 'The id of the signature type',
    required: true,
  })
  id!: string

  @ApiProperty({
    type: 'string',
    description: 'The title of the signature type',
    required: true,
  })
  title!: string

  @ApiProperty({
    type: 'string',
    description: 'The slug of the signature type',
    required: true,
  })
  slug!: string
}
