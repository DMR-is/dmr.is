import { AdvertModel } from '@dmr.is/official-journal/models'
import { advertTypeMigrate } from '@dmr.is/official-journal/modules/advert-type'
import { baseEntityMigrate } from '@dmr.is/shared/dto'

import { Advert } from '../dto/advert.dto'

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
    corrections: model.corrections
      ? model.corrections.map((item) => ({
          id: item.id,
          title: item.title,
          description: item.description,
          documentHtml: item.documentHtml ?? null,
          documentPdfUrl: item.documentPdfUrl ?? null,
          createdDate: item.created.toISOString(),
          updatedDate: item.updated.toISOString(),
          advertId: item.advertId,
        }))
      : undefined,
  }
  return advert
}
