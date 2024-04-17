import {
  Advert as AdvertDTO,
  AdvertAttachment,
  AdvertStatus as AdvertStatusDTO,
  Category,
  Department,
} from '@dmr.is/shared/dto'

import { Advert } from '../models/Advert'
import { advertCategoryMigrate } from './advert-category-migrate'
import { advertDepartmentMigrate } from './advert-department-migrate'
import { advertInvolvedPartyMigrate } from './advert-involvedparty-migrate'
import { advertTypesMigrate } from './advert-types-migrate'

export function advertMigrate(model: Advert): AdvertDTO {
  const status = model.status.title as keyof typeof AdvertStatusDTO
  const attachmentsDTO = model.attachments.map<AdvertAttachment>((item) => {
    const result: AdvertAttachment = {
      name: item.name,
      type: item.type,
      url: item.url,
    }
    return result
  })

  const advert: AdvertDTO = {
    id: model.id,
    title: `${model.type.title} fyrir ${model.subject}`,
    department: advertDepartmentMigrate(model.department),
    type: advertTypesMigrate(model.type),
    subject: model.subject,
    status: AdvertStatusDTO[status],
    publicationNumber: {
      full: `${model.serialNumber}/${model.publicationYear}`,
      number: model.serialNumber,
      year: model.publicationYear,
    },
    createdDate: model.created.toISOString(),
    updatedDate: model.updated.toISOString(),
    signatureDate: model.signatureDate.toISOString(),
    publicationDate: model.publicationDate.toISOString(),
    categories: model.categories.map((item) => advertCategoryMigrate(item)),
    involvedParty: advertInvolvedPartyMigrate(model.involvedParty),
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
