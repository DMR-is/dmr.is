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
    description: 'The text comes above the signature name',
  })
  textAbove?: string

  @ApiProperty({
    type: String,
    required: false,
    description: 'The text that comes before the signature name',
  })
  textBefore?: string

  /**
   * The text that comes below the signature name.
   */
  @ApiProperty({
    type: String,
    required: false,
    description: 'The text that comes below the signature name',
  })
  textBelow?: string

  /**
   * The text that comes after the signature name.
   */
  @ApiProperty({
    type: String,
    required: false,
    description: 'The text that comes after the signature name',
  })
  textAfter?: string
}
