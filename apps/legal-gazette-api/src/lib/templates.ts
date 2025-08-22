import { formatDate } from '@dmr.is/utils'

type CommonAdvertHTMLTemplateProps = {
  publishedAt: Date
  caption: string
  category: string
  html: string
  signatureName: string
  signatureOnBehalfOf?: string
  signatureLocation: string
  signatureDate: Date
  additionalText?: string | null
  caseNumber: string
  version: string
}

export const getCommonAdvertHTMLTemplate = ({
  publishedAt,
  caption,
  category,
  html,
  signatureName,
  signatureOnBehalfOf,
  signatureLocation,
  signatureDate,
  additionalText,
  caseNumber,
  version,
}: CommonAdvertHTMLTemplateProps) => {
  return `
  <div class="advert">
    <div class="advert__header">
      <p class="advert__header_publishing">Útgáfud.: ${formatDate(publishedAt, 'dd. MMMM yyyy')}</p>
      <h1 class="advert__header_title">${category} - ${caption}</h1>
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
