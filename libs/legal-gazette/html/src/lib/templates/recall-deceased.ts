import { isEmpty, isNotEmpty } from 'class-validator'

import { formatNationalId } from '@dmr.is/utils/server/formatting'

import { RecallDeceasedSettlement, RecallDeceasedTemplateProps } from './types'
import {
  getElement,
  getStatementLocation,
  getStatementPrefix,
  getTableCell,
  getTableHeaderCell,
  parseAndFormatDate,
} from './utils'

const getIntro = ({
  courtDistrict = '',
  judgementDate = '',
}: {
  courtDistrict?: string | null
  judgementDate?: Date | string | null
}) => {
  const formattedJudgementDate = parseAndFormatDate(judgementDate)
  const formattedCourtDistrict = isEmpty(courtDistrict) ? '' : courtDistrict

  return getElement({
    text: `
    Með úrskurði ${formattedCourtDistrict} uppkveðnum ${formattedJudgementDate} var neðangreint bú tekið til opinberra skipta. Sama dag var undirritaður lögmaður skipaður skiptastjóri dánarbúsins:
  `,
  })
}

const getSettlementText = (settlement: RecallDeceasedSettlement): string => {
  switch (settlement.type) {
    case 'undivided':
      return `${settlement.name} sat í óskiptu búi eftir sem lést þann .`
    case 'owner': {
      const companies = settlement.companies
      if (isEmpty(companies) || !companies?.length) return ''

      if (companies.length === 1) {
        const company = companies[0]
        return `Athygli er vakin á því að dánarbúið ber ótakmarkaða ábyrgð á skuldbindingum félagsins ${company.companyName || ''} kt. ${formatNationalId(company.companyNationalId || '')}.`
      }

      const companyList = companies
        .map(
          (company) =>
            ` ${company.companyName || ''} kt. ${formatNationalId(company.companyNationalId || '')}`,
        )
        .join(', ')
      return `Athygli er vakin á því að dánarbúið ber ótakmarkaða ábyrgð á skuldbindingum félaga: ${companyList}.`
    }
    default:
      return ''
  }
}

const getOutro = ({
  settlement,
}: {
  settlement?: RecallDeceasedSettlement
}) => {
  const statementPrefix = getStatementPrefix(settlement)

  const firstParagraph = getElement({
    text: `Hér með er skorað á alla þá, sem telja til skulda eða annarra réttinda á hendur framangreindu dánarbúi eða telja til eigna í umráðum þess, að lýsa kröfum sínum fyrir undirrituðum skiptastjóra í búinu innan tveggja mánaða frá fyrri birtingu þessarar innköllunar.`,
  })

  const secondParagraph = getElement({
    text: `Kröfulýsingar skulu sendar skiptastjóra ${statementPrefix}${getStatementLocation(settlement)}`,
  })

  return `${firstParagraph}${secondParagraph}`
}

const getTable = (cells: string[]) => {
  if (!cells.length) return ''

  const tableHeaderName = getTableHeaderCell('Dánarbú, nafn:')
  const tableHeaderDateOfDeath = getTableHeaderCell('Dánardagur:')

  return `
    <table>
      <tbody>
        <tr>${tableHeaderName}${tableHeaderDateOfDeath}</tr>
        <tr>${cells.join('')}</tr>
      </tbody>
    </table>
  `
}

export function getRecallDeceasedTemplate({
  courtDistrict = '',
  judgementDate = '',
  settlement = {
    nationalId: '',
    name: '',
    statementType: 'location',
    customLiquidatorLocation: '',
    liquidatorLocation: '',
    liquidatorName: '',
    dateOfDeath: '',
    address: '',
    type: 'default',
    companies: [],
  },
}: RecallDeceasedTemplateProps): string {
  const intro = getIntro({ courtDistrict, judgementDate })
  const outro = getOutro({ settlement })

  const nameArr = [
    settlement.name,
    settlement.nationalId
      ? `kt. ${formatNationalId(settlement.nationalId)}`
      : '',
    settlement.address ? `síðasta heimilisfang:<br />${settlement.address}` : '',
  ].filter(isNotEmpty)

  const nameCell = nameArr.length
    ? getTableCell({ text: nameArr.join(',<br />') })
    : ''

  const formattedDateOfDeath = parseAndFormatDate(settlement.dateOfDeath)
  const dateOfDeathCell = formattedDateOfDeath
    ? getTableCell({ text: formattedDateOfDeath })
    : ''

  const table = getTable([nameCell, dateOfDeathCell].filter(isNotEmpty))

  const settlementText = getSettlementText(settlement)
  const settlementMarkup = settlementText
    ? getElement({ text: settlementText })
    : ''

  const markupArr = [intro, table, settlementMarkup, outro].filter(isNotEmpty)

  return markupArr.join('')
}
