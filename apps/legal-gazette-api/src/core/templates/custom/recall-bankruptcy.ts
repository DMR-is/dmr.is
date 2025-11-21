/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { isDefined } from 'class-validator'

import { InternalServerErrorException } from '@nestjs/common'

import { getLogger } from '@dmr.is/logging'
import { formatDate } from '@dmr.is/utils'

import { AdvertModel } from '../../../models/advert.model'
import { getElement, getTableCell, getTableHeaderCell } from '../element'

const LOGGING_CONTEXT = 'RecallBankruptcyTemplate'
const logger = getLogger(LOGGING_CONTEXT)

function validateRecallBankruptcyModel(model: AdvertModel) {
  if (!isDefined(model.settlement)) {
    logger.error('Settlement data not provided', { context: LOGGING_CONTEXT })

    return false
  }

  if (!isDefined(model.settlement?.deadline)) {
    logger.error('Settlement deadline not provided', {
      context: LOGGING_CONTEXT,
    })

    return false
  }

  if (!isDefined(model.judgementDate)) {
    logger.error('Judgement date not provided', { context: LOGGING_CONTEXT })

    return false
  }

  if (!isDefined(model.divisionMeetingDate)) {
    logger.error('Division meeting date not provided', {
      context: LOGGING_CONTEXT,
    })

    return false
  }

  if (!isDefined(model.divisionMeetingLocation)) {
    logger.error('Division meeting location not provided', {
      context: LOGGING_CONTEXT,
    })

    return false
  }

  return true
}

export function getRecallBankruptcyTemplate(model: AdvertModel): string {
  const isValid = validateRecallBankruptcyModel(model)

  if (!isValid) {
    throw new InternalServerErrorException(
      'Invalid model provided for recall bankruptcy template',
    )
  }

  const settlement = model.settlement!
  const deadline = settlement.deadline!
  const judgementDate = model.judgementDate!
  const divisionMeetingDate = model.divisionMeetingDate!
  const divisionMeetingLocation = model.divisionMeetingLocation!

  const intro = getElement(
    `Með úrskurði ${model.courtDistrict?.title} uppkveðnum ${formatDate(judgementDate, 'dd. MMMM yyyy')} var eftirtalið bú tekið til gjaldþrotaskipta. Sama dag var undirritaður skipaður skiptastjóri í búinu. Frestdagur við gjaldþrotaskiptin er tilgreindur við nafn viðkomandi bús.`,
  )

  const outro = `
    ${getElement('Hér með er skorað á alla þá, sem telja til skulda eða annarra réttinda á hendur búinu eða eigna í umráðum þess, að lýsa kröfum sínum fyrir undirrituðum skiptastjóra í búinu innan tveggja mánaða frá fyrri birtingu innköllunar þessarar.')}
    ${getElement(`Kröfulýsingar skulu sendar skiptastjóra að ${settlement.liquidatorLocation}`)}
    ${getElement(`Skiptafundur til að fjalla um skrá um lýstar kröfur og ráðstöfun á eignum og réttindum búsins verður haldinn á skrifstofu skiptastjóra að ${divisionMeetingLocation}, á ofangreindum tíma.`)}
    ${getElement(`Komi ekkert fram um eignir í búinu mun skiptum lokið á þeim skiptafundi með vísan til 155. gr. laga nr. 21/1991 um gjaldþrotaskipti o.fl. Skrá um lýstar kröfur mun liggja frammi á skrifstofu skiptastjóra síðustu viku fyrir skiptafundinn.`)}
  `

  const tableHeaderName = getTableHeaderCell('Nafn bús:')
  const tableHeaderDeadline = getTableHeaderCell('Frestdagur:')
  const tableHeaderDivisionMeeting = getTableHeaderCell('Skiptafundur:')

  const nameCell = getTableCell(`
    ${model.settlement?.name},
    <br />
    kt. ${model.settlement?.nationalId},
    <br />
    ${model.settlement?.address}
    <br />
  `)
  const deadlineCell = getTableCell(formatDate(deadline, 'dd. MMMM yyyy'))
  const divisionMeetingCell = getTableCell(`
    ${formatDate(divisionMeetingDate, 'EEEE')}
    <br />
    ${formatDate(divisionMeetingDate, 'dd. MMMM yyyy')}
    <br />
    kl. ${formatDate(divisionMeetingDate, 'HH:mm')}
    <br />
  `)

  return `
        ${intro}
        <table>
          <tbody>
            <tr>
              ${tableHeaderName}
              ${tableHeaderDeadline}
              ${tableHeaderDivisionMeeting}
            </tr>
            <tr>
              ${nameCell}
              ${deadlineCell}
              ${divisionMeetingCell}
            </tr>
          </tbody>
        </table>
        ${outro}
      `
}
