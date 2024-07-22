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
    description: 'Key of the case tag',
    example: 'InReview',
    required: true,
    type: String,
  })
  readonly key!: string

  @ApiProperty({
    description: 'Value of the case tag',
    example: 'Í yfirlestri',
    required: true,
    type: String,
  })
  readonly value!: string
}
