import { ApiProperty } from '@nestjs/swagger'

import { CaseTagEnum } from '../cases'

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
    enum: CaseTagEnum,
    description: 'Title of the case tag',
    example: 'Í yfirlestri',
    required: true,
  })
  readonly title!: CaseTagEnum

  @ApiProperty({
    description: 'Slug of the case tag',
    example: 'i-yfirlestri',
    required: true,
  })
  readonly slug!: string
}
