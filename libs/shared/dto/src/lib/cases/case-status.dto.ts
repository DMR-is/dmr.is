import { ApiProperty } from '@nestjs/swagger'

export class CaseStatus {
  @ApiProperty({
    type: String,
    example: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
  })
  readonly id!: string

  @ApiProperty({
    type: String,
    example: 'Innsent',
    description: 'Status of the case',
  })
  readonly title!: string

  @ApiProperty({
    type: String,
    example: 'innsent',
    description: 'Slug of the case staus',
  })
  slug!: string
}
