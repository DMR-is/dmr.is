import { formatNationalId } from '@dmr.is/utils/server/formatting'
import { formatDate } from '@dmr.is/utils/server/serverUtils'

import { AdvertModel } from '../../../models/advert.model'
import { getElement, getTableCell, getTableHeaderCell } from '../element'

export function getDivisionEndingTemplate(model: AdvertModel): string {
  // Render what we can, gracefully handle missing data
  const judgmentDate = model.judgementDate
  const name = model.settlement?.name

  const nationalId = formatNationalId(model.settlement?.nationalId ?? '')
  const declaredClaims = model.settlement?.declaredClaims

  const intro = `
    ${getElement(`Með úrskurði héraðsdóms Reykjavíkur uppkveðnum ${judgmentDate ? formatDate(judgmentDate, 'd. MMMM yyyy') : ''} var neðangreint bú tekið til gjaldþrotaskipta. Sama dag var undirritaður lögmaður skipaður skiptastjóri í þrotabúinu.`)}
    ${getElement(`Engar eignir fundust í búinu og var skiptum í því lokið 17. janúar 2025 samkvæmt 155. gr. laga nr. 21/1991 án þess að greiðsla fengist upp í lýstar kröfur, auk áfallinna vaxta og kostnaðar eftir úrskurðardag gjaldþrotaskipta.`)}
  `

  const tableHeaderName = getTableHeaderCell('Nafn bús:')
  const declaredClaimsHeader = getTableHeaderCell('Lýstar kröfur:')

  const settlementCell = getTableCell(`
      ${name || ''}, <br />
      kt. ${nationalId}
    `)

  const declaredClaimsCell = getTableCell(`
      kr. ${declaredClaims},
    `)

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

  return `
    ${intro}
    ${tableMarkup}
  `
}
