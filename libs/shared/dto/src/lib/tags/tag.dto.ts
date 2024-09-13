import { ApiProperty } from '@nestjs/swagger'

export class CaseTag {
  @ApiProperty({
    description: 'Unique ID for the case tag',
    example: '00000000-0000-0000-0000-000000000000',
    required: true,
    nullable: false,
    type: String,
  })
  readonly id!: string

  @ApiProperty({
    description: 'Title of the case tag',
    example: 'Í yfirlestri',
    required: true,
    type: String,
  })
  readonly title!: string

  @ApiProperty({
    description: 'Slug of the case tag',
    example: 'i-yfirlestri',
    required: true,
  })
  readonly slug!: string
}
