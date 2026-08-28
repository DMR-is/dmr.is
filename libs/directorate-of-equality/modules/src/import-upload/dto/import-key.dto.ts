import { ApiString } from '@dmr.is/decorators'

/**
 * Body shared by every key-based import endpoint. The key references a workbook
 * already uploaded to S3 via the presign endpoint; the endpoint fetches and
 * parses it. Shape is validated against the caller's boundary prefix in the
 * service before any S3 read.
 */
export class ImportKeyDto {
  @ApiString({
    description: 'S3 object key returned by the presign endpoint.',
    maxLength: 256,
  })
  key!: string
}
