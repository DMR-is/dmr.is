import { ApiProperty } from '@nestjs/swagger'

export class AdvertCorrection {
  @ApiProperty({
    type: String,
    example: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
  })
  readonly id!: string

  @ApiProperty({
    type: String,
    description: 'Title of the correction',
  })
  readonly title?: string

  @ApiProperty({
    type: String,
    description: 'The correction description',
  })
  readonly description!: string

  @ApiProperty({
    type: String,
    description: 'Id of the advert being corrected',
  })
  readonly advertId!: string

  @ApiProperty({
    type: String,
    required: false,
  })
  readonly documentHtml?: string

  @ApiProperty({
    type: String,
    required: false,
  })
  readonly documentPdfUrl?: string

  @ApiProperty({
    required: true,
    nullable: false,
    type: String,
    example: '2024-01-01T09:00:00Z',
  })
  readonly createdDate!: string

  @ApiProperty({
    required: true,
    nullable: false,
    type: String,
    example: '2024-01-20T09:00:00Z',
  })
  readonly updatedDate!: string
}
