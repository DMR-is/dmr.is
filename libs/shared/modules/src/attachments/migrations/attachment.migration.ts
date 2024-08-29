import { ApplicationAttachment } from '@dmr.is/shared/dto'

import { ApplicationAttachmentModel } from '../models/application-attachment.model'

export const attachmentMigrate = (
  model: ApplicationAttachmentModel,
): ApplicationAttachment => {
  return {
    id: model.id,
    applicationId: model.applicationId,
    originalFileName: model.originalFileName,
    fileName: model.fileName,
    fileFormat: model.fileFormat,
    fileExtension: model.fileExtension,
    fileLocation: model.fileLocation,
    fileSize: model.fileSize,
    type: model.type,
    deleted: model.deleted,
  }
}
