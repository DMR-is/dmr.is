import { Advert, AdvertAttachment, AdvertStatus } from '@dmr.is/shared/dto'

import { AdvertDTO } from '../models'
import { advertCategoryMigrate } from './advert-category-migrate'
import { advertDepartmentMigrate } from './advert-department-migrate'
import { advertInvolvedPartyMigrate } from './advert-involvedparty-migrate'
import { advertTypesMigrate } from './advert-types-migrate'

export function advertMigrate(model: AdvertDTO): Advert {
  const status = model.status.title as keyof typeof AdvertStatus
  const attachmentsDTO = model.attachments.map<AdvertAttachment>((item) => {
    const result: AdvertAttachment = {
      name: item.name,
      type: item.type,
      url: item.url,
    }
    return result
  })

  const advert: Advert = {
    id: model.id,
    title: `${model.type.title} fyrir ${model.subject}`,
    department: model.department
      ? advertDepartmentMigrate(model.department)
      : null,
    type: model.type ? advertTypesMigrate(model.type) : null,
    subject: model.subject,
    status: AdvertStatus[status],
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
      ? model.categories.map((item) => advertCategoryMigrate(item))
      : [],
    involvedParty: model.involvedParty
      ? advertInvolvedPartyMigrate(model.involvedParty)
      : null,
    document: {
      //no migrate because this is not a database table.
      html: model.documentHtml,
      isLegacy: model.isLegacy,
      pdfUrl: model.documentPdfUrl,
    },
    signature: null,
    attachments: attachmentsDTO,
  }
  return advert
}
