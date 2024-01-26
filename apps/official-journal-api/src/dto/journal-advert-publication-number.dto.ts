import { ApiProperty } from '@nestjs/swagger'

export class JournalAdvertPublicationNumber {
  @ApiProperty({
    description: 'Serial number of the publication number.',
    example: '1',
    required: true,
  })
  readonly number!: number

  @ApiProperty({
    description: 'Year of the publication number.',
    example: '2024',
    required: true,
  })
  readonly year!: number

  @ApiProperty({
    description:
      'Full publication number, with both `number` and `year` separated with `/`.',
    example: '1/2024',
    required: true,
  })
  readonly full!: string
}
