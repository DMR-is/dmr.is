import { isNotEmpty } from 'class-validator'

import { formatNationalId } from '@dmr.is/utils/server/formatting'
import { formatDate } from '@dmr.is/utils/server/serverUtils'

import { DivisionMeetingDeceasedTemplateProps } from './types'
import {
  getElement,
  getTableCell,
  getTableHeaderCell,
  parseAndFormatDate,
} from './utils'

export function getDivisionMeetingDeceasedTemplate({
  meetingDate = '',
  meetingLocation = '',
  name = '',
  nationalId = '',
  content = '',
}: DivisionMeetingDeceasedTemplateProps): string {
  const intro = getElement({
    text: `Skiptafundur í eftirfarandi dánarbúi verður haldinn að ${meetingLocation} á neðangreindum tíma.`,
  })

  const tableHeaderName = getTableHeaderCell('Dánarbú, nafn:')
  const tableHeaderMeeting = getTableHeaderCell('Skiptafundur:')

  const nameArr = [
    name,
    nationalId ? `kt. ${formatNationalId(nationalId)}` : '',
  ].filter(isNotEmpty)

  const nameCell = nameArr.length
    ? getTableCell({ text: nameArr.join('<br />') })
    : ''

  const parsedMeetingDate = parseAndFormatDate(meetingDate)

  const meetingCell = parsedMeetingDate
    ? getTableCell({
        text: [
          parsedMeetingDate,
          `kl. ${formatDate(parsedMeetingDate, 'HH:mm')}`,
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
    </table>
  `
    : ''

  const markupArr = [intro, table, content].filter(isNotEmpty)

  return markupArr.join('')
}
