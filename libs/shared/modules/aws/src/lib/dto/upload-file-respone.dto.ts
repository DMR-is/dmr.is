import { ApiProperty } from '@nestjs/swagger'

export class S3UploadFileResponse {
  @ApiProperty({
    type: String,
    description: 'The URL of the uploaded file.',
  })
  url!: string

  @ApiProperty({
    type: String,
    description: 'Filename of the uploaded file.',
  })
  filename!: string

  @ApiProperty({
    type: Number,
    description: 'The size of the uploaded file.',
  })
  size!: number
}
