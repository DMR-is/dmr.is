import format from 'date-fns/format'

import { Advert } from '@dmr.is/shared/dto'

type Regulation = {
  number: string
  subject: string
  link: string
  body: string
  recordid: string
  advertizer: string
  subject2: string
  publishingdate: string
  signaturedate: string
}

export const advertsToRegulations = (advert: Advert): Regulation => {
  return {
    subject: advert.type?.title ?? 'Reglugerð',
    subject2: advert.subject,
    link: advert.document.pdfUrl ?? '',
    recordid: advert.id,
    body: advert.document.html ?? '',
    publishingdate: format(
      advert.publicationDate ? new Date(advert.publicationDate) : new Date(),
      "yyyy-MM-dd HH':'mm':'ss",
    ),

    signaturedate: format(
      advert.signatureDate ? new Date(advert.signatureDate) : new Date(),
      "yyyy-MM-dd HH':'mm':'ss",
    ),
    advertizer: advert.involvedParty.title,
    number: advert.publicationNumber?.full ?? '',
  }
}
