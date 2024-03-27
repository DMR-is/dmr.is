import { ApiProperty } from '@nestjs/swagger'

export class AdvertPublicationNumber {
  @ApiProperty({
    description: 'Serial number of the publication number.',
    example: '1',
    required: true,
    type: Number,
  })
  readonly number!: number

  @ApiProperty({
    description: 'Year of the publication number.',
    example: '2024',
    required: true,
    type: Number,
  })
  readonly year!: number

  @ApiProperty({
    description:
      'Full publication number, with both `number` and `year` separated with `/`.',
    example: '1/2024',
    required: true,
    type: String,
  })
  readonly full!: string
}
