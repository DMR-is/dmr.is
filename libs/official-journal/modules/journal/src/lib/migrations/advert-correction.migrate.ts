import { AdvertCorrection } from '@dmr.is/shared/dto'

import { AdvertCorrectionModel } from '../models'

export function advertCorrectionMigrate(
  model: AdvertCorrectionModel,
): AdvertCorrection {
  const result: AdvertCorrection = {
    id: model.id,
    title: model.title,
    description: model.description,
    documentHtml: model.documentHtml ?? null,
    documentPdfUrl: model.documentPdfUrl ?? null,
    createdDate: model.created.toISOString(),
    updatedDate: model.updated.toISOString(),
    advertId: model.advertId,
  }
  return result
}
