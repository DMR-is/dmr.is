import { formatDate } from '@dmr.is/utils'

import { AdvertModel } from '../../../models/advert.model'
import { getElement, getTableCell, getTableHeaderCell } from '../element'

export function getDivisionMeetingBankruptcyTemplate(
  model: AdvertModel,
): string {
  // Render what we can, gracefully handle missing data
  const name = model.settlement?.name
  const address = model.settlement?.address
  const nationalId = model.settlement?.nationalId
  const meetingDate = model.divisionMeetingDate
  const location = model.divisionMeetingLocation

  const intro = getElement(
    `Skiptafundur í eftirtöldu þrotabúi verður haldinn á skrifstofu skiptastjóra að ${location || ''} á neðangreindum tíma. Komi ekki fram ábendingar um eignir í búinu í síðasta lagi á fundinum, má vænta þess að skiptum verði lokið þar á grundvelli 155. gr. laga nr. 21/1991.`,
  )

  const tableHeaderName = getTableHeaderCell('Nafn bús:')
  const tableHeaderLocation = getTableHeaderCell('Skiptafundur:')

  const settlementCell = getTableCell(`
        ${name || ''},<br />
        kt: ${nationalId || ''},<br />
        ${address || ''}
      `)
  const meetingCell = getTableCell(`
        ${meetingDate ? formatDate(meetingDate, 'd. MMMM yyyy') : ''},<br />
        kl. ${meetingDate ? formatDate(meetingDate, 'HH:mm') : ''}
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
