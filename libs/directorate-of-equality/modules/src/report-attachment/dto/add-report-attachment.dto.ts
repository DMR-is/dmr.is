import { ApiEnum, ApiString } from '@dmr.is/decorators'

import { ReportAttachmentExtensionEnum } from '../models/report-attachment.model'

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
  @ApiEnum(ReportAttachmentExtensionEnum, {
    enumName: 'ReportAttachmentExtensionEnum',
    description: "The uploaded file's extension, without the dot.",
  })
  extension!: ReportAttachmentExtensionEnum
}
