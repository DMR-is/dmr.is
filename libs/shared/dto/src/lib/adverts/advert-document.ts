import { ApiProperty } from '@nestjs/swagger'

export class AdvertDocument {
  @ApiProperty({
    description: 'Is the `html` from the legacy system?',
    example: 'false',
    required: true,
    type: Boolean,
  })
  readonly isLegacy!: boolean

  @ApiProperty({
    description:
      'Full HTML for the advert, either generated by new system or legacy system based on `isLegacy`.',
    example: '<html string>',
    required: true,
    nullable: true,
    type: String,
  })
  html!: string | null

  @ApiProperty({
    description: 'URL for the generated PDF file.',
    example: '<url>',
    required: false,
    nullable: true,
    type: String,
  })
  readonly pdfUrl!: string | null
}
