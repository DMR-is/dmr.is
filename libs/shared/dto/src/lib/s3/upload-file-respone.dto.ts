import { ApiProperty } from '@nestjs/swagger'

export class S3UploadFileResponse {
  @ApiProperty({
    type: String,
    description: 'The URL of the uploaded file.',
  })
  url!: string
}
