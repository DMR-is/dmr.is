import format from 'date-fns/format'
import is from 'date-fns/locale/is'

import { BadRequestException } from '@nestjs/common'

import { cleanupSingleEditorOutput } from '@island.is/regulations-tools/cleanupEditorOutput'
import { HTMLText } from '@island.is/regulations-tools/types'

import { AdvertModel } from '../../advert/advert.model'
import { pdfStyles } from './pdf.css'

type GetSignatureMarkupProps = {
  name: string
  jobTitle?: string
  location: string
  date: string
}

type GetHTMLMarkupProps = {
  title: string
  publishingDate: string
  content: HTMLText | string
  signature: GetSignatureMarkupProps
}

const formatDate = (date: Date) => {
  return format(date, 'dd. MMMM yyyy', { locale: is })
}

const getSignatureMarkup = ({
  name,
  jobTitle,
  location,
  date,
}: GetSignatureMarkupProps) => {
  return `
    <div class="signature">
      <p>${location}, <em>${formatDate(new Date(date))}</em></p>
      <p><strong>${name}</strong>${jobTitle ? ` ${jobTitle}` : ''}</p>
    </div>
  `
}

const getHtmlMarkup = ({
  content,
  publishingDate,
  title,
  signature,
}: GetHTMLMarkupProps) => {
  const cleaneContentdMarkup = cleanupSingleEditorOutput(content as HTMLText)
  const cleanedSignatureMarkup = cleanupSingleEditorOutput(
    getSignatureMarkup(signature) as HTMLText,
  )
  return `
  <html>
    <head>
      <title>${title}</title>
      <style>
        ${pdfStyles}
      </style>
      <body>
        <p align="right">${publishingDate}</p>
        <h1 class="regulation__title">${title}</h1>
        <div class="regulation__text">
            ${cleaneContentdMarkup}
            <section class="regulation__signature">
              ${cleanedSignatureMarkup}
            </section>
        </div>
      </body>
  </head>
</html>

`
}

export const commonAdvertTemplate = (advert: AdvertModel) => {
  if (!advert.commonAdvert) {
    throw new BadRequestException('Advert is not of correct type')
  }

  const html = getHtmlMarkup({
    title: advert.title,
    content: advert.html,
    publishingDate: advert.publishedAt
      ? formatDate(new Date(advert.publishedAt))
      : formatDate(new Date(advert.scheduledAt)),
    signature: {
      name: advert.signatureName,
      location: advert.signatureLocation,
      date: advert.signatureDate.toISOString(),
    },
  })

  return html
}
