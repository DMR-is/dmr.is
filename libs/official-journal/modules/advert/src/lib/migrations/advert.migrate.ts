import { AdvertModel } from '@dmr.is/official-journal/models'
import { baseEntityMigrate } from '@dmr.is/shared/dto'

import { advertCorrectionMigrate } from '@dmr.is/official-journal/migrations/advert-correction/advert-correction.migrate'
import { Advert } from '../dto/advert.dto'
import { advertTypeMigrate } from '@dmr.is/official-journal/migrations/advert-type/advert-type.migrate'

export function advertMigrate(model: AdvertModel): Advert {
  const advert: Advert = {
    id: model.id,
    title: `${model.type.title} ${model.subject}`,
    department: baseEntityMigrate(model.department),
    type: model.type ? advertTypeMigrate(model.type) : null,
    subject: model.subject,
    status: model.status.title,
    publicationNumber: {
      full: `${model.serialNumber}/${model.publicationYear}`,
      number: model.serialNumber,
      year: model.publicationYear,
    },
    createdDate: model.created.toISOString(),
    updatedDate: model.updated.toISOString(),
    signatureDate: model.signatureDate.toISOString(),
    publicationDate: model.publicationDate.toISOString(),
    categories: model.categories
      ? model.categories.map((item) => baseEntityMigrate(item))
      : [],
    involvedParty: {
      id: model.involvedParty.id,
      title: model.involvedParty.title,
      slug: model.involvedParty.slug,
      nationalId: model.involvedParty.nationalId,
    },
    document: {
      //no migrate because this is not a database table.
      html: model.documentHtml,
      isLegacy: model.isLegacy,
      pdfUrl: model.documentPdfUrl,
    },
    attachments: model.attachments.map((item) => ({
      type: item.type,
      name: item.name,
      url: item.url,
    })),
    corrections:
      model.corrections?.map((item) => advertCorrectionMigrate(item)) ?? [],
  }
  return advert
}
