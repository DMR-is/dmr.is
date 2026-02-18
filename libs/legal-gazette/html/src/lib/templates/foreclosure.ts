import { formatDate } from '@dmr.is/utils/server/serverUtils'

import { ForeclosureTemplateProps } from './types'
import { getElement, getTableCell, parseAndFormatDate } from './utils'
import { isNotEmpty } from 'class-validator'

export function getForeclosureTemplate({
  foreclosure,
  publicationNumber,
}: ForeclosureTemplateProps): string {
  const formattedForeclosureDate = parseAndFormatDate(
    foreclosure?.foreclosureDate,
  )
  const formattedForeclosureTime = formatDate(formattedForeclosureDate, 'HH:mm')
  const intro = getElement({
    text: `Eftirtalin beiðni um nauðungarsölu til fullnustu kröfu um peningagreiðslu verður tekin fyrir á skrifstofu embættisins ${foreclosure?.foreclosureAddress},
    ${formattedForeclosureDate} kl. ${formattedForeclosureTime}  hafi hún ekki áður verið felld niður:`,
  })

  const properties = foreclosure?.properties
    ?.map((property, i) => {
      const propertyIndex = `${(i + 1).toString().padStart(3, '0')}`
      const paddedPublication = `${publicationNumber}-${propertyIndex}`

      const propertyName = getTableCell({
        text: property?.name,
        options: {
          italic: true,
          heading: 'Heiti eignar:',
        },
      })
      const propertyNumber = getTableCell({
        text: property?.number,
        options: {
          italic: true,
          heading: 'Fastanr.:',
        },
      })
      const respondent = getTableCell({
        text: property?.respondent,
        options: {
          italic: true,
          heading: 'Gerðarþoli (-ar):',
        },
      })
      const claimant = getTableCell({
        text: property?.claimant,
        options: {
          italic: true,
          heading: 'Gerðarbeiðandi (-beiðendur):',
        },
      })
      const propertyTotalPrice = getTableCell({
        text: property?.totalPrice?.toString(),
        options: {
          italic: true,
          heading: 'Fjárhæðir krafna í kr.:',
        },
      })

      const publicationNumberCell = getTableCell({
        text: paddedPublication,
        options: {
          italic: true,
        },
      })

      return `
          <table>
            <tbody>
              <tr>
                ${propertyName}
              </tr>
              <tr>
                ${propertyNumber}
              </tr>
              <tr>
                ${respondent}
              </tr>
              <tr>
                ${claimant}
              </tr>
              <tr>
                ${propertyTotalPrice}
              </tr>
              <tr>
                ${publicationNumberCell}
              </tr>
            </tbody>
          </table>
        `
    })
    .join('<br/>')

  const markupArr = [intro, properties].filter(isNotEmpty)

  return markupArr.join('')
}
