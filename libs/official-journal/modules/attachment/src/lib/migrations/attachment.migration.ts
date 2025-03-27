import { AttachmentTypeEnum } from '@dmr.is/constants'
import { ApplicationAttachment } from '@dmr.is/shared/dto'
import { enumMapper } from '@dmr.is/utils'

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
    type: {
      id: model.type.id,
      title: enumMapper(model.type.title, AttachmentTypeEnum),
      slug: model.type.slug,
    },
    deleted: model.deleted,
  }
}
