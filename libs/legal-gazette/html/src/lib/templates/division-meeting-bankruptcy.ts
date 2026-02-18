import { isNotEmpty } from 'class-validator'

import { formatNationalId } from '@dmr.is/utils/server/formatting'
import { formatDate } from '@dmr.is/utils/server/serverUtils'

import { DivisionMeetingBankruptcyTemplateProps } from './types'
import {
  getElement,
  getTableCell,
  getTableHeaderCell,
  parseAndFormatDate,
} from './utils'

export function getDivisionMeetingBankruptcyTemplate({
  address = '',
  meetingDate = '',
  name = '',
  nationalId = '',
  meetingLocation = '',
  content = '',
}: DivisionMeetingBankruptcyTemplateProps): string {
  const intro = getElement({
    text: `Skiptafundur í eftirfarandi þrotabúi verður haldinn að ${meetingLocation || ''} á neðangreindum tíman.`,
  })

  const tableHeaderName = getTableHeaderCell('Nafn bús:')
  const tableHeaderMeeting = getTableHeaderCell('Skiptafundur:')

  const nameArr = [
    name,
    nationalId ? `kt. ${formatNationalId(nationalId)}` : '',
    address,
  ].filter(isNotEmpty)

  const nameCell = nameArr.length
    ? getTableCell({ text: nameArr.join(',<br />') })
    : ''

  const formattedMeetingDate = parseAndFormatDate(meetingDate)

  const meetingCell = formattedMeetingDate
    ? getTableCell({
        text: [
          formattedMeetingDate,
          `kl. ${formatDate(formattedMeetingDate, 'HH:mm')}`,
        ].join('<br />'),
      })
    : ''

  const table = [nameCell, meetingCell].filter(isNotEmpty).length
    ? `
    <table>
      <tbody>
        <tr>${tableHeaderName}${tableHeaderMeeting}</tr>
        <tr>${nameCell}${meetingCell}</tr>
      </tbody>
    </table>.
  `
    : ''


  const markupArr = [intro, content, table].filter(isNotEmpty)

  return markupArr.join('')
}
