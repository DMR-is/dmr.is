import { ApiProperty } from '@nestjs/swagger'

/**
 * Represents a signature member.
 */
export class SignatureMember {
  /**
   * The name/title/w.e. of the signature member.
   */
  @ApiProperty({
    type: String,
    required: true,
    description: 'The name/title/w.e. of the signature member',
  })
  text!: string

  /**
   * The text that comes above the signature member value.
   */
  @ApiProperty({
    type: String,
    required: false,
    description: 'The text comes above the signature member value',
  })
  textAbove?: string

  /**
   * The text that comes below the signature member value.
   */
  @ApiProperty({
    type: String,
    required: false,
    description: 'The text cines below the signature member value',
  })
  textBelow?: string

  /**
   * The text that comes after the signature member value.
   */
  @ApiProperty({
    type: String,
    required: false,
    description: 'The text that comes after the signature member value',
  })
  textAfter?: string
}
