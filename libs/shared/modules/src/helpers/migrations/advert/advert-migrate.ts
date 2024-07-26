import {
  Advert,
  AdvertApplicationAttachment,
  AdvertStatus,
} from '@dmr.is/shared/dto'

import { AdvertDTO } from '../../../journal/models'
import { advertCategoryMigrate } from './advert-category-migrate'
import { advertDepartmentMigrate } from './advert-department-migrate'
import { advertInvolvedPartyMigrate } from './advert-involvedparty-migrate'
import { advertStatusMigrate } from './advert-status-migrate'
import { advertTypesMigrate } from './advert-types-migrate'

export function advertMigrate(model: AdvertDTO): Advert {
  const status = advertStatusMigrate(model.status)
  const attachmentsDTO = model.attachments.map<AdvertApplicationAttachment>(
    (item) => {
      const result: AdvertApplicationAttachment = {
        name: item.name,
        url: item.url,
      }
      return result
    },
  )

  const advert: Advert = {
    id: model.id,
    title: `${model.type ? advertTypesMigrate(model.type) : null} ${
      model.subject
    }`,
    department: model.department
      ? advertDepartmentMigrate(model.department)
      : null,
    type: model.type ? advertTypesMigrate(model.type) : null,
    subject: model.subject,
    status: status,
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
    involvedParty: advertInvolvedPartyMigrate(model.involvedParty),
    document: {
      //no migrate because this is not a database table.
      html: model.documentHtml,
      isLegacy: model.isLegacy,
      pdfUrl: model.documentPdfUrl,
    },
    signature: null,
    attachments: attachmentsDTO.map((item) => ({ ...item, type: '' })),
  }
  return advert
}
