import { ApiProperty } from '@nestjs/swagger'

export class CaseDetailAdvertMainType {
  @ApiProperty({
    type: 'string',
    description: 'The id of the main advert type',
    required: true,
  })
  id!: string

  @ApiProperty({
    type: 'string',
    description: 'The title of the main advert type',
    required: true,
  })
  title!: string

  @ApiProperty({
    type: 'string',
    description: 'The slug of the main advert type',
    required: true,
  })
  slug!: string
}
