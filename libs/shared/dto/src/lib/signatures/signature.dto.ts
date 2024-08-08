import { ApiProperty } from '@nestjs/swagger'

export class Signature {
  @ApiProperty({
    type: 'string',
    description: 'The id of the signature',
    required: true,
  })
  id!: string
}
