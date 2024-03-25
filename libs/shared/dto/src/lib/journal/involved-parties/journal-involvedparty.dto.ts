import { ApiProperty } from '@nestjs/swagger'

export class JournalAdvertInvolvedParty {
  @ApiProperty({
    description: 'Unique ID for the involved party, GUID format.',
    example: '00000000-0000-0000-0000-000000000000',
    required: true,
    nullable: false,
    type: String,
  })
  readonly id!: string

  @ApiProperty({
    description: 'Title of the involved party.',
    example: 'Dómstólar og réttarfar',
    required: true,
    type: String,
  })
  readonly title!: string

  @ApiProperty({
    description: 'Slug of the involved party, used in URLs and API requests.',
    example: 'domstolar-og-rettarfar',
    required: true,
    type: String,
  })
  readonly slug!: string
}
