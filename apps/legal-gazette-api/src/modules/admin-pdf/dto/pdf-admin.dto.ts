import { ApiProperty } from '@nestjs/swagger'

export class RegeneratePdfResponseDto {
  @ApiProperty({
    description: 'The URL of the regenerated PDF',
    example:
      'https://files.legal-gazette.dev.dmr-dev.cloud/adverts/123/456/advert.pdf',
  })
  pdfUrl!: string

  @ApiProperty({
    description: 'Success message',
    example: 'PDF regenerated successfully',
  })
  message!: string
}
