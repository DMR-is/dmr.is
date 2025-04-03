import { AdvertCorrection } from "@dmr.is/official-journal/dto/advert-correction/advert-correction.dto"
import { AdvertCorrectionModel } from "@dmr.is/official-journal/models"


export function advertCorrectionMigrate(
  model: AdvertCorrectionModel,
): AdvertCorrection {
  const result: AdvertCorrection = {
    id: model.id,
    title: model.title,
    description: model.description,
    documentHtml: model.documentHtml,
    documentPdfUrl: model.documentPdfUrl,
    createdDate: model.created.toISOString(),
    updatedDate: model.updated.toISOString(),
    legacyDate: model?.legacyDate?.toISOString() ?? null,
    isLegacy: model?.isLegacy ?? null,
    advertId: model.advertId,
  }
  return result
}
