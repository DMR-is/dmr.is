import { formatDate } from '@dmr.is/utils'

import { AdvertModel } from '../modules/advert/advert.model'

export const getCommonAdvertHTMLTemplate = (model: AdvertModel) => {
  return `
  <div class="advert">
    <div class="advert__header">
      <p class="advert__header_publishing">Útgáfud.: ${formatDate(model.publishedAt ? model.publishedAt : model.scheduledAt, 'dd. MMMM yyyy')}</p>
      <h1 class="advert__header_title">${model.category.title}</h1>
    </div>
    ${
      model.additionalText
        ? `<div class="advert__additional"><p>${model.additionalText}</p></div>`
        : ''
    }

    <div class="advert__content">
      ${model.html}
    </div>
    <div class="advert__signature">
      <p>${model.signatureLocation}, ${formatDate(model.signatureDate, 'dd. MMMM yyyy')}</p>
      ${model.signatureOnBehalfOf ? `<p>${model.signatureOnBehalfOf}</p>` : ''}
      <p>${model.signatureName}</p>
    </div>
    <div>
      <p class="advert__version">${model.case.caseNumber}${model.version}</p>
    </div>
  </div>
  `
}

export const getCommonAdvertHTMLTemplateFromApplication = ({
  publishedAt,
  categoryTitle,
  additionalText,
  html,
  signatureLocation,
  signatureDate,
  signatureOnBehalfOf,
  signatureName,
  caseNumber,
  version,
}: {
  publishedAt: Date
  categoryTitle: string
  additionalText?: string
  html: string
  signatureLocation: string
  signatureDate: Date
  signatureOnBehalfOf?: string
  signatureName: string
  caseNumber: string
  version: string
}) => {
  return `
    <div class="advert">
    <div class="advert__header">
      <p class="advert__header_publishing">Útgáfud.: ${formatDate(publishedAt, 'dd. MMMM yyyy')}</p>
      <h1 class="advert__header_title">${categoryTitle}</h1>
    </div>
    ${
      additionalText
        ? `<div class="advert__additional"><p>${additionalText}</p></div>`
        : ''
    }

    <div class="advert__content">
      ${html}
    </div>
    <div class="advert__signature">
      <p>${signatureLocation}, ${formatDate(signatureDate, 'dd. MMMM yyyy')}</p>
      ${signatureOnBehalfOf ? `<p>${signatureOnBehalfOf}</p>` : ''}
      <p>${signatureName}</p>
    </div>
    <div>
      <p class="advert__version">${caseNumber}${version}</p>
    </div>
  </div>
  `
}

export const getDivisionMeetingAdvertHTMLTemplate = (model: AdvertModel) => {
  return `
  <div class="advert">
    <div class="advert__header">
      <p class="advert__header_publishing">Útgáfud.: ${formatDate(
        new Date(),
        'dd. MMMM yyyy',
      )}</p>
      <h1 class="advert__header_title">Skiptafundur</h1>
    </div>
    ${
      model.dataValues
        ? `<div class="advert__additional"><p>${model.additionalText}</p></div>`
        : ''
    }

    <div class="advert__content">
      <p>Boðað er til skiptafundar ${formatDate(
        model.scheduledAt,
        'dd. MMMM yyyy',
      )} kl. ${formatDate(model.scheduledAt, 'HH:mm')}.</p>
      <p>Fundurinn fer fram í skrásettu heimili dánarbúsins.</p>
    </div>
    <div class="advert__signature">
      <p>${model.signatureLocation}, ${formatDate(model.signatureDate, 'dd. MMMM yyyy')}</p>
      ${model.signatureOnBehalfOf ? `<p>${model.signatureOnBehalfOf}</p>` : ''}
      <p><strong>${model.signatureName}</strong></p>
    </div>
    <div>
      <p class="advert__version">${model.case.caseNumber}${model.version}</p>
    </div>
  </div>
  `
}

export const getRecallAdvertHTMLTemplate = (model: AdvertModel) => {
  return `
  <div class="advert">
    <div class="advert__header">
      <p class="advert__header_publishing">Útgáfud.: ${formatDate(
        model.publishedAt ? model.publishedAt : model.scheduledAt,
        'dd. MMMM yyyy',
      )}</p>
      <h1 class="advert__header_title">Endurköllun</h1>
    </div>
    ${
      model.additionalText
        ? `<div class="advert__additional"><p>${model.additionalText}</p></div>`
        : ''
    }

    <div class="advert__content">
      ${model.html}
    </div>
    <div class="advert__signature">
      <p>${model.signatureLocation}, ${formatDate(model.signatureDate, 'dd. MMMM yyyy')}</p>
      ${model.signatureOnBehalfOf ? `<p>${model.signatureOnBehalfOf}</p>` : ''}
      <p><strong>${model.signatureName}</strong></p>
    </div>
    <div>
      <p class="advert__version">${model.case.caseNumber}${model.version}</p>
    </div>
  </div>
  `
}

export const getDivisionEndingAdvertHTMLTemplate = (model: AdvertModel) => {
  return `
  <div class="advert">
    <div class="advert__header">
      <p class="advert__header_publishing">Útgáfud.: ${formatDate(
        model.publishedAt ? model.publishedAt : model.scheduledAt,
        'dd. MMMM yyyy',
      )}</p>
      <h1 class="advert__header_title">Lokað fyrir kröfur</h1>
    </div>
    ${
      model.additionalText
        ? `<div class="advert__additional"><p>${model.additionalText}</p></div>`
        : ''
    }

    <div class="advert__content">
      ${model.html}
    </div>
    <div class="advert__signature">
      <p>${model.signatureLocation}, ${formatDate(model.signatureDate, 'dd. MMMM yyyy')}</p>
      ${model.signatureOnBehalfOf ? `<p>${model.signatureOnBehalfOf}</p>` : ''}
      <p><strong>${model.signatureName}</strong></p>
    </div>
    <div>
      <p class="advert__version">${model.case.caseNumber}${model.version}</p>
    </div>
  </div>
  `
}
