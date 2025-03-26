import { ApiProperty } from '@nestjs/swagger'

import { S3UploadFileResponse } from './upload-file-respone.dto'

export class S3UploadFilesResponse {
  @ApiProperty({
    type: [S3UploadFileResponse],
    description: 'The uploaded files.',
  })
  files!: S3UploadFileResponse[]
}
