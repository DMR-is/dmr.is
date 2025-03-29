import { AdvertModel } from '@dmr.is/official-journal/models'
import { advertTypeMigrate } from '@dmr.is/official-journal/modules/advert-type'
import { baseEntityMigrate } from '@dmr.is/shared/dto'

import { Advert } from '../dto/advert.dto'
import { AdvertAttachment } from '../dto/advert-attachment'
import { advertCorrectionMigrate } from './advert-correction.migrate'
import { advertInvolvedPartyMigrate } from './advert-involvedparty.migrate'
import { advertStatusMigrate } from './advert-status.migrate'

export function advertMigrate(model: AdvertModel): Advert {
  const attachmentsmodel = model.attachments.map<AdvertAttachment>((item) => {
    const result: AdvertAttachment = {
      type: item.type,
      name: item.name,
      url: item.url,
    }
    return result
  })

  const advert: Advert = {
    id: model.id,
    title: `${model.type.title} ${model.subject}`,
    department: baseEntityMigrate(model.department),
    type: model.type ? advertTypeMigrate(model.type) : null,
    subject: model.subject,
    status: advertStatusMigrate(model.status),
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
    involvedParty: advertInvolvedPartyMigrate(model.involvedParty),
    document: {
      //no migrate because this is not a database table.
      html: model.documentHtml,
      isLegacy: model.isLegacy,
      pdfUrl: model.documentPdfUrl,
    },
    signature: null,
    attachments: attachmentsmodel.map((item) => ({ ...item, type: '' })),
    corrections: model.corrections
      ? model.corrections.map((item) => advertCorrectionMigrate(item))
      : undefined,
  }
  return advert
}
