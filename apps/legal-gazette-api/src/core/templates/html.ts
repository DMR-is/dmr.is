import { InternalServerErrorException } from '@nestjs/common'

import { formatDate } from '@dmr.is/utils'

import { AdvertModel, AdvertTemplateType } from '../../models/advert.model'
import { AdvertVersionEnum } from '../../models/advert-publication.model'
import { getDivisionEndingTemplate } from './custom/division-ending'
import { getDivisionMeetingBankruptcyTemplate } from './custom/division-meeting-bankruptcy'
import { getDivisionMeetingDeceasedTemplate } from './custom/division-meeting-deceased'
import { getRecallBankruptcyTemplate } from './custom/recall-bankruptcy'
import { getRecallDeceasedTemplate } from './custom/recall-deceased'
import { getCommonTemplate } from './common'
import { getElement } from './element'
import { getSignatureMarkup } from './signature'

export function getAdvertHtmlMarkup(
  model: AdvertModel,
  version: AdvertVersionEnum = AdvertVersionEnum.A,
): string {
  const publication = model.publications.find(
    (pub) => pub.versionLetter === version,
  )
  const publicationDate = publication?.publishedAt || publication?.scheduledAt
  const publicationNumber = model.publicationNumber
    ? `${model.publicationNumber}${version}`
    : `(Reiknast við útgáfu)${version}`

  if (!publicationDate) {
    throw new InternalServerErrorException(
      'Publication date not found for advert',
    )
  }

  const additionalMarkup = getElement(model.additionalText)
  const titleMarkup = getElement(model.title, {
    as: 'h1',
    className: 'advertHeading',
  })
  const publicationMarkup = getElement(publicationNumber, {
    className: 'advertSerial',
  })
  const publishingDateMarkup = getElement(
    publication.publishedAt
      ? `Útgáfud.: ${formatDate(publicationDate, 'd. MMMM yyyy')}`
      : `Áætlaður útgáfud.: ${formatDate(publicationDate, 'd. MMMM yyyy')}`,
    { className: 'advertSerial' },
  )

  const signatureMarkup = model.signature
    ? getSignatureMarkup({
        date: model.signature.date,
        location: model.signature.location,
        name: model.signature.name,
        onBehalfOf: model.signature.onBehalfOf,
      })
    : ''

  let htmlContent = ``
  switch (model.templateType) {
    case AdvertTemplateType.COMMON:
      htmlContent = getCommonTemplate(model)
      break
    case AdvertTemplateType.RECALL_BANKRUPTCY:
      htmlContent = getRecallBankruptcyTemplate(model)
      break
    case AdvertTemplateType.RECALL_DECEASED:
      htmlContent = getRecallDeceasedTemplate(model)
      break
    case AdvertTemplateType.DIVISION_MEETING_BANKRUPTCY:
      htmlContent = getDivisionMeetingBankruptcyTemplate(model)
      break
    case AdvertTemplateType.DIVISION_MEETING_DECEASED:
      htmlContent = getDivisionMeetingDeceasedTemplate(model)
      break
    case AdvertTemplateType.DIVISION_ENDING:
      htmlContent = getDivisionEndingTemplate(model)
      break
    default:
      htmlContent = getCommonTemplate(model)
  }

  const advertContent = getElement(htmlContent, {
    as: 'div',
    className: 'advertContent',
  })

  return `
    <div class="advert legal-gazette">
      ${publishingDateMarkup}
      ${titleMarkup}
      ${additionalMarkup}
      ${advertContent}
      ${signatureMarkup}
      ${publicationMarkup}
    </div>
  `
}
