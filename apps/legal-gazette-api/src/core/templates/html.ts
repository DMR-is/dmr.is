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
  version: AdvertVersionEnum | undefined = AdvertVersionEnum.A,
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

// Type for preview when advert model hasn't been created yet
export type AdvertPreviewData = {
  templateType: AdvertTemplateType
  title: string
  typeId?: string
  additionalText?: string | null
  content?: string
  publicationNumber?: string | null
  signature?: {
    date?: Date | null
    location?: string | null
    name?: string | null
    onBehalfOf?: string | null
  } | null
  publications?: Array<{
    versionLetter: AdvertVersionEnum
    publishedAt?: Date | string | null
    scheduledAt: Date | string
  }>
  settlement?: {
    type?: string
    liquidatorName?: string
    liquidatorLocation?: string
    liquidatorRecallStatementLocation?: string | null
    liquidatorRecallStatementType?: string
    name?: string
    nationalId?: string
    address?: string
    deadline?: Date | string | null
    dateOfDeath?: Date | string | null
    declaredClaims?: number | null
    companies?: any[]
    partnerNationalId?: string | null
    partnerName?: string | null
  } | null
  // Template-specific properties
  foreclosure?: any // For foreclosure template
  judgementDate?: Date | string | null
  divisionMeetingDate?: Date | string | null
  divisionMeetingLocation?: string | null
  courtDistrict?: {
    title?: string
  } | null
}

export function getAdvertHTMLMarkupPreview(
  data: AdvertPreviewData,
  version: AdvertVersionEnum | undefined = AdvertVersionEnum.A,
): string {
  const publication = data.publications?.find(
    (pub) => pub.versionLetter === version,
  )
  const publicationDate = publication?.publishedAt || publication?.scheduledAt
  const publicationNumber = data.publicationNumber
    ? `${data.publicationNumber}${version}`
    : `(Reiknast við útgáfu)${version}`

  if (!publicationDate) {
    throw new InternalServerErrorException(
      'Publication date not found for advert preview',
    )
  }

  const parsedPublicationDate =
    typeof publicationDate === 'string'
      ? new Date(publicationDate)
      : publicationDate

  const additionalMarkup = getElement(data.additionalText)
  const titleMarkup = getElement(data.title, {
    as: 'h1',
    className: 'advertHeading',
  })
  const publicationMarkup = getElement(publicationNumber, {
    className: 'advertSerial',
  })
  const publishingDateMarkup = getElement(
    publication?.publishedAt
      ? `Útgáfud.: ${formatDate(parsedPublicationDate, 'd. MMMM yyyy')}`
      : `Áætlaður útgáfud.: ${formatDate(parsedPublicationDate, 'd. MMMM yyyy')}`,
    { className: 'advertSerial' },
  )

  const signatureMarkup = data.signature
    ? getSignatureMarkup({
        date: data.signature.date,
        location: data.signature.location,
        name: data.signature.name,
        onBehalfOf: data.signature.onBehalfOf,
      })
    : ''

  // Create a mock model-like object for template functions
  const mockModel = {
    templateType: data.templateType,
    content: data.content,
    typeId: data.typeId,
    settlement: data.settlement
      ? {
          ...data.settlement,
          // Convert string dates to Date objects if needed
          deadline: data.settlement.deadline
            ? typeof data.settlement.deadline === 'string'
              ? new Date(data.settlement.deadline)
              : data.settlement.deadline
            : null,
          dateOfDeath: data.settlement.dateOfDeath
            ? typeof data.settlement.dateOfDeath === 'string'
              ? new Date(data.settlement.dateOfDeath)
              : data.settlement.dateOfDeath
            : null,
        }
      : null,
    foreclosure: data.foreclosure,
    judgementDate: data.judgementDate
      ? typeof data.judgementDate === 'string'
        ? new Date(data.judgementDate)
        : data.judgementDate
      : null,
    divisionMeetingDate: data.divisionMeetingDate
      ? typeof data.divisionMeetingDate === 'string'
        ? new Date(data.divisionMeetingDate)
        : data.divisionMeetingDate
      : null,
    divisionMeetingLocation: data.divisionMeetingLocation,
    courtDistrict: data.courtDistrict,
  } as AdvertModel

  let htmlContent = ``
  switch (data.templateType) {
    case AdvertTemplateType.COMMON:
      htmlContent = getCommonTemplate(mockModel)
      break
    case AdvertTemplateType.RECALL_BANKRUPTCY:
      htmlContent = getRecallBankruptcyTemplate(mockModel)
      break
    case AdvertTemplateType.RECALL_DECEASED:
      htmlContent = getRecallDeceasedTemplate(mockModel)
      break
    case AdvertTemplateType.DIVISION_MEETING_BANKRUPTCY:
      htmlContent = getDivisionMeetingBankruptcyTemplate(mockModel)
      break
    case AdvertTemplateType.DIVISION_MEETING_DECEASED:
      htmlContent = getDivisionMeetingDeceasedTemplate(mockModel)
      break
    case AdvertTemplateType.DIVISION_ENDING:
      htmlContent = getDivisionEndingTemplate(mockModel)
      break
    default:
      htmlContent = getCommonTemplate(mockModel)
  }

  const advertContent = getElement(htmlContent, {
    as: 'div',
    className: 'advertContent',
  })

  return `<div class="advert legal-gazette">${publishingDateMarkup}${titleMarkup}${additionalMarkup}${advertContent}${signatureMarkup}${publicationMarkup}</div>`
}
