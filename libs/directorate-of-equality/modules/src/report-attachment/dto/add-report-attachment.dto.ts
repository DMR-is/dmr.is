import { ApiString } from '@dmr.is/decorators'

/** Registers a file already PUT to the presigned URL. */
export class AddReportAttachmentDto {
  @ApiString({
    description: 'Object key returned by the attachment presign endpoint.',
    maxLength: 256,
  })
  key!: string

  @ApiString({
    description:
      'The name the file was uploaded under. Its extension must match the key.',
    maxLength: 255,
  })
  filename!: string
}

/** Asks for a presigned upload URL for one attachment. */
export class PresignReportAttachmentDto {
  @ApiString({
    description: 'The file extension: pdf, docx, xlsx or xls.',
    maxLength: 10,
  })
  extension!: string
}
