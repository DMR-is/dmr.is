import { ApiProperty } from '@nestjs/swagger'

export class Department {
  @ApiProperty({
    description: 'Unique ID for the advert department, GUID format.',
    example: '00000000-0000-0000-0000-000000000000',
    required: true,
    nullable: false,
    type: String,
  })
  readonly id!: string

  @ApiProperty({
    description: 'Title of the advert department.',
    example: 'A deild',
    required: true,
    type: String,
  })
  readonly title!: string

  @ApiProperty({
    description:
      'Slug of the advert department, used in URLs and API requests.',
    example: 'a-deild',
    required: true,
    type: String,
  })
  readonly slug!: string
}
