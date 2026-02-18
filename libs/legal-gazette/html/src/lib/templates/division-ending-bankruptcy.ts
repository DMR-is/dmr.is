import { isNotEmpty } from 'class-validator'

import { DivisionEndingTemplateProps } from './types'
import {
  getElement,
  getTableCell,
  getTableHeaderCell,
  parseAndFormatDate,
} from './utils'

export function getDivisionEndingBankruptcyTemplate({
  courtDistrict = '',
  endingDate = '',
  judgementDate = '',
  settlementName = '',
  settlementNationalId = '',
  settlementDeclaredClaims = '',
  content = '',
}: DivisionEndingTemplateProps): string {
  const formattedJudgementDate = parseAndFormatDate(judgementDate)
  const formattedEndingDate = parseAndFormatDate(endingDate)

  const intro = getElement({
    text: `Með úrskurði ${courtDistrict}, uppkveðnum ${formattedJudgementDate}, var neðangreint bú tekið til gjaldþrotaskipta. Sama dag var undirritaður lögmaður skipaður skiptastjóri í þrotabúinu. Skiptum var lokið þann ${formattedEndingDate}.`,
  })

  const tableHeaderName = getTableHeaderCell('Nafn bús:')
  const declaredClaimsHeader = getTableHeaderCell(
    settlementDeclaredClaims ? 'Lýstar kröfur:' : '',
  )

  const settlementMarkup = [
    settlementName,
    settlementNationalId ? `kt. ${settlementNationalId}` : '',
  ]
    .filter(isNotEmpty)
    .join(', <br />')

  const settlementCell = getTableCell({ text: settlementMarkup })

  const declaredClaimsCell = getTableCell({
    text: settlementDeclaredClaims ? `kr. ${settlementDeclaredClaims}` : '',
  })

  const tableMarkup = `
    <table>
      <tbody>
        <tr>
          ${tableHeaderName}
          ${declaredClaimsHeader}
        </tr>
        <tr>
          ${settlementCell}
          ${declaredClaimsCell}
        </tr>
      </tbody>
    </table>
  `

  const markupArr = [intro, content, tableMarkup].filter(isNotEmpty)

  return markupArr.join('')
}
