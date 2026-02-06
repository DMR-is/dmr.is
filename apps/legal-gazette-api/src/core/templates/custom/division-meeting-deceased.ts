import { formatDate } from '@dmr.is/utils'
import { formatNationalId } from '@dmr.is/utils/client'

import { AdvertModel } from '../../../models/advert.model'
import { getElement, getTableCell, getTableHeaderCell } from '../element'

export function getDivisionMeetingDeceasedTemplate(model: AdvertModel): string {
  // Render what we can, gracefully handle missing data
  const name = model.settlement?.name
  const address = model.settlement?.address
  const nationalId = formatNationalId(model.settlement?.nationalId ?? '')
  const meetingDate = model.divisionMeetingDate
  const location = model.divisionMeetingLocation

  const intro = getElement(
    `Skiptafundur í eftirtöldu dánarbúi verður haldinn á skrifstofu skiptastjóra að ${location || ''} á neðangreindum tíma.`,
  )

  const tableHeaderName = getTableHeaderCell('Dánarbú, nafn:')
  const tableHeaderLocation = getTableHeaderCell('Skiptafundur:')

  const nameCell = getTableCell(name || '')
  const dateCell = getTableCell(
    meetingDate ? formatDate(meetingDate, 'd. MMMM yyyy') : '',
  )

  const nationalIdCell = getTableCell(`kt. ${nationalId}`)
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
