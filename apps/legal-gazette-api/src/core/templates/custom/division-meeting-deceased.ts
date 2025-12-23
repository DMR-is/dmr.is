/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { isDefined } from 'class-validator'

import { InternalServerErrorException } from '@nestjs/common'

import { getLogger } from '@dmr.is/logging'
import { formatDate } from '@dmr.is/utils'

import { AdvertModel } from '../../../models/advert.model'
import { getElement, getTableCell, getTableHeaderCell } from '../element'

const LOGGING_CONTEXT = 'DivisionMeetingDeceasedTemplate'
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

export function getDivisionMeetingDeceasedTemplate(model: AdvertModel): string {
  // Render what we can, gracefully handle missing data
  const name = model.settlement?.name
  const address = model.settlement?.address
  const nationalId = model.settlement?.nationalId
  const meetingDate = model.divisionMeetingDate
  const location = model.divisionMeetingLocation

  const intro = getElement(
    `Skiptafundur í eftirtöldu dánarbúi verður haldinn á skrifstofu skiptastjóra að ${location || ''} á neðangreindum tíma.`,
  )

  const tableHeaderName = getTableHeaderCell('Dánarbú, nafn:')
  const tableHeaderLocation = getTableHeaderCell('Skiptafundur:')

  const nameCell = getTableCell(name || '')
  const dateCell = getTableCell(
    meetingDate ? formatDate(meetingDate, 'dd. MMMM yyyy') : '',
  )

  const nationalIdCell = getTableCell(`kt. ${nationalId || ''}`)
  const timeCell = getTableCell(
    `${meetingDate ? formatDate(meetingDate, 'HH:mm') : ''}`,
  )

  const lastAddressCell = getTableCell('síðasta heimilisfang')
  const addressCell = getTableCell(address || '')

  const tableMarkup = `
        <table>
            <tbody>
              <tr>
                ${tableHeaderName}
                ${tableHeaderLocation}
              </tr>
              <tr>
                ${nameCell}
                ${dateCell}
              </tr>
              <tr>
                ${nationalIdCell}
                ${timeCell}
              </tr>
              <tr>
                ${lastAddressCell}
              </tr>
              <tr>
                ${addressCell}
              </tr>
            </tbody>
          </table>
  `

  return `
    ${intro}
    ${tableMarkup}
  `
}
