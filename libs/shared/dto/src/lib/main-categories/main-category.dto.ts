import { ApiProperty } from '@nestjs/swagger'

import { Category } from '../categories'

export class MainCategory {
  @ApiProperty({
    description: 'Unique ID for the main category, GUID format.',
    example: '00000000-0000-0000-0000-000000000000',
    required: true,
    nullable: false,
    type: String,
  })
  readonly id!: string

  @ApiProperty({
    description: 'Title of the main category.',
    example: 'Dómstólar og réttarfar',
    required: true,
    type: String,
  })
  readonly title!: string

  @ApiProperty({
    description: 'Slug of the main category, used in URLs and API requests.',
    example: 'domstolar-og-rettarfar',
    required: true,
    type: String,
  })
  readonly slug!: string

  @ApiProperty({
    description: 'Description of the main category, used on front page.',
    example: 'Hæstiréttur, lögmenn, lögreglumál, dómsmál og landsdómur.',
    required: true,
    type: String,
  })
  readonly description!: string

  @ApiProperty({
    isArray: true,
    type: () => Category,
    description: 'List of sub categories under this main category.',
    required: true,
  })
  readonly categories!: Category[]
}
