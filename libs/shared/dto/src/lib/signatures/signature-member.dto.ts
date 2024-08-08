import { ApiProperty } from '@nestjs/swagger'

export class SignatureMember {
  @ApiProperty({
    type: String,
    required: true,
    description: 'The name/title/w.e. of the signature member',
  })
  value!: string

  @ApiProperty({
    type: String,
    required: false,
    description: 'The text comes above the signature member value',
  })
  textAbove?: string

  @ApiProperty({
    type: String,
    required: false,
    description: 'The text cines below the signature member value',
  })
  textBelow?: string

  @ApiProperty({
    type: String,
    required: false,
    description: 'The text that comes after the signature member value',
  })
  textAfter?: string
}
