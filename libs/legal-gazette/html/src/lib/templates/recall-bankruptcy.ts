import { isNotEmpty } from 'class-validator'

import { RecallBankruptcySettlement } from './types'
import {
  formatNationalId,
  getElement,
  getStatementLocation,
  getStatementPrefix,
  getTableCell,
  getTableHeaderCell,
  parseAndFormatDate,
} from './utils'
type RecallBankruptcyTemplateProps = {
  courtDistrict?: string
  judgementDate?: Date | string
  settlement?: RecallBankruptcySettlement
}

const getIntro = ({
  courtDistrict = '',
  judgementDate = '',
}: {
  courtDistrict?: string | null
  judgementDate?: Date | string | null
}) => {
  const [formattedJudgementDate] = parseAndFormatDate(judgementDate)
  const formattedCourtDistrict = isNotEmpty(courtDistrict) ? courtDistrict : ''

  const intro = `
    Með úrskurði ${formattedCourtDistrict} uppkveðnum ${formattedJudgementDate} var eftirtalið bú
     tekið til gjaldþrotaskipta. Sama dag var undirritaður skipaður skiptastjóri í búinu.
     Frestdagur við gjaldþrotaskiptin er tilgreindur við nafn viðkomandi bús.
  `

  return getElement({ text: intro })
}

const getOutro = ({
  settlement,
}: {
  settlement?: RecallBankruptcySettlement
}) => {
  const statementPrefix = getStatementPrefix(settlement)

  const firstParagraph = getElement({
    text: `
    Hér með er skorað á alla þá, sem telja til skulda eða annarra réttinda á hendur búinu
     eða eigna í umráðum þess, að lýsa kröfum sínum fyrir undirrituðum skiptastjóra í búinu
     innan tveggja mánaða frá fyrri birtingu innköllunar þessarar.`,
  })

  const secondParagraph = getElement({
    text: `
    Kröfulýsingar skulu sendar skiptastjóra ${statementPrefix}${getStatementLocation(settlement)}`,
  })

  const thirdParagraph = getElement({
    text: `
    Skiptafundur til að fjalla um skrá um lýstar kröfur og ráðstöfun á eignum og réttindum búsins verður
     haldinn á skrifstofu skiptastjóra að ${settlement?.meetingLocation}, á ofangreindum tíma.`,
  })

  const fourthParagraph = getElement({
    text: `
    Komi ekkert fram um eignir í búinu mun skiptum lokið á þeim skiptafundi með vísan til
     155. gr. laga nr. 21/1991 um gjaldþrotaskipti o.fl. Skrá um lýstar kröfur mun liggja frammi á
     skrifstofu skiptastjóra síðustu viku fyrir skiptafundinn.`,
  })

  return `${firstParagraph}${secondParagraph}${thirdParagraph}${fourthParagraph}`
}

const getTable = (cells: string[]) => {
  if (cells.length === 0) return ''

  const tableHeaderName = getTableHeaderCell('Nafn bús:')
  const tableHeaderDeadline = getTableHeaderCell('Frestdagur:')
  const tableHeaderDivisionMeeting = getTableHeaderCell('Skiptafundur:')

  return `
    <table>
      <tbody>
        <tr>${tableHeaderName}${tableHeaderDeadline}${tableHeaderDivisionMeeting}</tr>
        <tr>${cells.join('')}</tr>
      </tbody>
    </table>
  `
}

export const getRecallBankruptcyTemplate = ({
  courtDistrict = '',
  judgementDate = '',
  settlement = {
    address: '',
    name: '',
    nationalId: '',
    deadlineDate: '',
    meetingDate: '',
    meetingLocation: '',
    liquidatorName: '',
    liquidatorLocation: '',
    customLiquidatorLocation: '',
    statementType: 'location',
  },
}: RecallBankruptcyTemplateProps) => {
  const [formattedDeadlineDate] = parseAndFormatDate(settlement?.deadlineDate)

  const intro = getIntro({ courtDistrict, judgementDate })
  const outro = getOutro({ settlement })

  const nameArr = [
    settlement.name,
    settlement.nationalId
      ? `kt. ${formatNationalId(settlement.nationalId)}`
      : '',
    settlement.address,
  ].filter(isNotEmpty)

  const nameCell = nameArr.length
    ? getTableCell({
        text: nameArr.join(',<br />'),
      })
    : ''

  const deadlineCell = isNotEmpty(formattedDeadlineDate)
    ? getTableCell({ text: formattedDeadlineDate })
    : ''

  const [parsedMeetingDate, formattedWeekday, formattedMeetingTime] =
    parseAndFormatDate(settlement?.meetingDate)

  const divisionMeetingCell = parsedMeetingDate
    ? getTableCell({
        text: [parsedMeetingDate, formattedWeekday, formattedMeetingTime].join(
          '<br />',
        ),
      })
    : ''

  const markupArr = [nameCell, deadlineCell, divisionMeetingCell].filter(
    isNotEmpty,
  )
  const table = getTable(markupArr)

  return `${intro}${table}${outro}`
}
