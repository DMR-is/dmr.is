import {
  ApiDateTime,
  ApiDtoArray,
  ApiEnum,
  ApiNumber,
  ApiString,
  ApiUUId,
} from '@dmr.is/decorators'

import { ReportAttachmentExtensionEnum } from '../models/report-attachment.model'

/** One attachment's metadata. Never carries the file itself. */
export class ReportAttachmentDto {
  @ApiUUId()
  id!: string

  @ApiString({ description: 'The name the company uploaded the file under.' })
  filename!: string

  @ApiEnum(ReportAttachmentExtensionEnum, {
    enumName: 'ReportAttachmentExtensionEnum',
  })
  extension!: ReportAttachmentExtensionEnum

  @ApiNumber({ description: 'Size of the file in bytes.' })
  sizeBytes!: number

  @ApiDateTime()
  createdAt!: Date
}

export class GetReportAttachmentsResponseDto {
  @ApiDtoArray(ReportAttachmentDto)
  attachments!: ReportAttachmentDto[]
}
