/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { isDefined } from 'class-validator'

import { InternalServerErrorException } from '@nestjs/common'

import { getLogger } from '@dmr.is/logging'
import { formatDate } from '@dmr.is/utils'

import { AdvertModel } from '../../../models/advert.model'
import { getElement, getTableCell, getTableHeaderCell } from '../element'

const LOGGING_CONTEXT = 'DivisionMeetingBankruptcyTemplate'
const logger = getLogger(LOGGING_CONTEXT)

function validateDivisionMeetingModel(model: AdvertModel): boolean {
  if (!isDefined(!model.divisionMeetingDate)) {
    logger.error('Division meeting date is not provided', {
      context: LOGGING_CONTEXT,
    })
    return false
  }

  if (!isDefined(!model.divisionMeetingLocation)) {
    logger.error('Division meeting location is not provided', {
      context: LOGGING_CONTEXT,
    })
    return false
  }

  if (!isDefined(!model.settlement)) {
    logger.error('Settlement is not provided', { context: LOGGING_CONTEXT })
    return false
  }

  if (!isDefined(!model.settlement?.name)) {
    logger.error('Settlement name is not provided', {
      context: LOGGING_CONTEXT,
    })
    return false
  }

  if (!isDefined(!model.settlement?.nationalId)) {
    logger.error('Settlement national ID is not provided', {
      context: LOGGING_CONTEXT,
    })
    return false
  }

  return true
}

export function getDivisionMeetingBankruptcyTemplate(
  model: AdvertModel,
): string {
  if (!validateDivisionMeetingModel(model)) {
    throw new InternalServerErrorException(
      'Division meeting model validation failed',
    )
  }

  const name = model.settlement!.name!
  const address = model.settlement!.address!
  const nationalId = model.settlement!.nationalId!
  const meetingDate = model.divisionMeetingDate!
  const location = model.divisionMeetingLocation!

  const intro = getElement(
    `Skiptafundur í eftirtöldu þrotabúi verður haldinn á skrifstofu skiptastjóra að ${location} á neðangreindum tíma. Komi ekki fram ábendingar um eignir í búinu í síðasta lagi á fundinum, má vænta þess að skiptum verði lokið þar á grundvelli 155. gr. laga nr. 21/1991.`,
  )

  const tableHeaderName = getTableHeaderCell('Nafn bús:')
  const tableHeaderLocation = getTableHeaderCell('Skiptafundur:')

  const settlementCell = getTableCell(`
        ${name},<br />
        kt: ${nationalId},<br />
        ${address}
      `)
  const meetingCell = getTableCell(`
        ${formatDate(meetingDate, 'dd. MMMM yyyy')},<br />
        kl. ${formatDate(meetingDate, 'HH:mm')}
      `)

  const tableMarkup = `
        <table>
          <tbody>
            <tr>
              ${tableHeaderName}
              ${tableHeaderLocation}
            </tr>
            <tr>
              ${settlementCell}
              ${meetingCell}
            </tr>
          </tbody>
        </table>
  `

  return `
    ${intro}
    ${tableMarkup}
  `
}
