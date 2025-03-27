import { AdvertCorrectionModel } from '@dmr.is/official-journal/models'
import { AdvertCorrection } from '../dto/advert-correction.dto'

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
