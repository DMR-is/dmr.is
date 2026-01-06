import { InternalServerErrorException } from '@nestjs/common'

import { getLogger } from '@dmr.is/logging'
import { formatDate } from '@dmr.is/utils'

import { ForeclosureModel } from '../../../models/foreclosure.model'
import { getElement, getTableCell } from '../element'

const LOGGING_CONTEXT = 'ForeclosureTemplate'
const logger = getLogger(LOGGING_CONTEXT)

export function getForeclosureTemplate(
  foreclosure: ForeclosureModel,
  publicationNumber = '(Reiknast við útgáfu)',
): string {
  if (!foreclosure) {
    logger.error('Foreclosure data not provided', { context: LOGGING_CONTEXT })
    throw new InternalServerErrorException('Foreclosure data not provided')
  }

  const intro = getElement(
    `Eftirtalin beiðni um nauðungarsölu til fullnustu kröfu um peningagreiðslu verður tekin fyrir á skrifstofu embættisins ${foreclosure.foreclosureAddress},
    ${formatDate(foreclosure.foreclosureDate, 'd. MMMM yyyy')} kl. ${formatDate(foreclosure.foreclosureDate, 'HH:mm')}  hafi hún ekki áður verið felld niður:`,
  )

  const properties = foreclosure.properties
    .map((property, i) => {
      const propertyIndex = `${(i + 1).toString().padStart(3, '0')}`
      const paddedPublication = `${publicationNumber}-${propertyIndex}`

      const propertyName = getTableCell(property.propertyName, {
        italic: true,
        heading: 'Heiti eignar:',
      })
      const propertyNumber = getTableCell(property.propertyNumber, {
        italic: true,
        heading: 'Fastanr.:',
      })
      const respondent = getTableCell(property.respondent, {
        italic: true,
        heading: 'Gerðarþoli (-ar):',
      })
      const claimant = getTableCell(property.claimant, {
        italic: true,
        heading: 'Gerðarbeiðandi (-beiðendur):',
      })
      const propertyTotalPrice = getTableCell(
        property.propertyTotalPrice.toString(),
        {
          italic: true,
          heading: 'Fjárhæðir krafna í kr.:',
        },
      )

      const publicationNumberCell = getTableCell(paddedPublication, {
        italic: true,
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
              </tr>
              <tr>
                ${publicationNumberCell}
              </tr>
            </tbody>
          </table>
        `
    })
    .join('<br/>')

  return `
    ${intro}
    ${properties}
  `
}
