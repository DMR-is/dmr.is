import { ApiString } from '@dmr.is/decorators'

/**
 * Returned by the presign endpoint. The client PUTs the workbook bytes directly
 * to `url`, then passes `key` to the relevant import endpoint.
 */
export class PresignUploadResponseDto {
  @ApiString({
    description: 'Presigned S3 PUT URL the client uploads the .xlsx to. Expires in 1h.',
  })
  url!: string

  @ApiString({
    description:
      'Object key the upload lands at. Pass this back to the import endpoint.',
  })
  key!: string
}
