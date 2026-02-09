import { formatNationalId } from '@dmr.is/utils/client'
import { formatDate } from '@dmr.is/utils/serverUtils'

import { AdvertModel } from '../../../models/advert.model'
import { ApplicationRequirementStatementEnum } from '../../../models/application.model'
import { getElement, getTableCell, getTableHeaderCell } from '../element'

export function getRecallBankruptcyTemplate(model: AdvertModel): string {
  // Render what we can, gracefully handle missing data
  const settlement = model.settlement
  const deadline = settlement?.deadline
  const judgementDate = model.judgementDate
  const divisionMeetingDate = model.divisionMeetingDate
  const divisionMeetingLocation = model.divisionMeetingLocation

  const intro = getElement(
    `Með úrskurði ${model.courtDistrict?.possessiveTitle || ''} uppkveðnum ${judgementDate ? formatDate(judgementDate, 'd. MMMM yyyy') : ''} var eftirtalið bú tekið til gjaldþrotaskipta. Sama dag var undirritaður skipaður skiptastjóri í búinu. Frestdagur við gjaldþrotaskiptin er tilgreindur við nafn viðkomandi bús.`,
  )

  // Determine the correct location based on the statement type
  const getStatementLocation = () => {
    if (
      settlement?.liquidatorRecallStatementType ===
      ApplicationRequirementStatementEnum.LIQUIDATORLOCATION
    ) {
      return settlement?.liquidatorLocation || ''
    }
    // For CUSTOMLIQUIDATORLOCATION or CUSTOMLIQUIDATOREMAIL
    return settlement?.liquidatorRecallStatementLocation || ''
  }

  const statementPrefix =
    settlement?.liquidatorRecallStatementType ===
    ApplicationRequirementStatementEnum.CUSTOMLIQUIDATOREMAIL
      ? 'með rafrænum hætti á netfangið '
      : 'að '

  const outro = `${getElement('Hér með er skorað á alla þá, sem telja til skulda eða annarra réttinda á hendur búinu eða eigna í umráðum þess, að lýsa kröfum sínum fyrir undirrituðum skiptastjóra í búinu innan tveggja mánaða frá fyrri birtingu innköllunar þessarar.')}${getElement(`Kröfulýsingar skulu sendar skiptastjóra ${statementPrefix}${getStatementLocation()}`)}${getElement(`Skiptafundur til að fjalla um skrá um lýstar kröfur og ráðstöfun á eignum og réttindum búsins verður haldinn á skrifstofu skiptastjóra að ${divisionMeetingLocation || ''}, á ofangreindum tíma.`)}${getElement(`Komi ekkert fram um eignir í búinu mun skiptum lokið á þeim skiptafundi með vísan til 155. gr. laga nr. 21/1991 um gjaldþrotaskipti o.fl. Skrá um lýstar kröfur mun liggja frammi á skrifstofu skiptastjóra síðustu viku fyrir skiptafundinn.`)}`

  const tableHeaderName = getTableHeaderCell('Nafn bús:')
  const tableHeaderDeadline = getTableHeaderCell('Frestdagur:')
  const tableHeaderDivisionMeeting = getTableHeaderCell('Skiptafundur:')

  const nameCell = getTableCell(
    `${settlement?.name || ''},<br />kt. ${formatNationalId(settlement?.nationalId || '')},<br />${settlement?.address || ''}`,
  )
  const deadlineCell = getTableCell(
    deadline ? formatDate(deadline, 'd. MMMM yyyy') : '',
  )
  const divisionMeetingCell = getTableCell(
    `${divisionMeetingDate ? formatDate(divisionMeetingDate, 'EEEE') : ''}<br />${divisionMeetingDate ? formatDate(divisionMeetingDate, 'd. MMMM yyyy') : ''}<br />kl. ${divisionMeetingDate ? formatDate(divisionMeetingDate, 'HH:mm') : ''}`,
  )

  return `${intro}<table><tbody><tr>${tableHeaderName}${tableHeaderDeadline}${tableHeaderDivisionMeeting}</tr><tr>${nameCell}${deadlineCell}${divisionMeetingCell}</tr></tbody></table>${outro}`
}
