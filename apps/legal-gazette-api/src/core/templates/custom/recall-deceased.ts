/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { isEmpty } from 'class-validator'

import { SettlementType } from '@dmr.is/legal-gazette/schemas'
import { formatDate } from '@dmr.is/utils'

import { AdvertModel } from '../../../models/advert.model'
import { ApplicationRequirementStatementEnum } from '../../../models/application.model'
import { getElement, getTableCell, getTableHeaderCell } from '../element'

export function getRecallDeceasedTemplate(model: AdvertModel): string {
  // Render what we can, gracefully handle missing data
  const judgementDate = model.judgementDate
  const name = model.settlement?.name
  const dateOfDeath = model.settlement?.dateOfDeath
  const nationalId = model.settlement?.nationalId
  const address = model.settlement?.address
  const settlement = model.settlement

  const intro = getElement(
    `Með úrskurði ${model.courtDistrict?.title || ''} uppkveðnum ${judgementDate ? formatDate(judgementDate, 'd. MMMM yyyy') : ''} var neðangreint bú tekið til opinberra skipta. Sama dag var undirritaður lögmaður skipaður skiptastjóri dánarbúsins:`,
  )
  const tableHeaderName = getTableHeaderCell('Dánarbú, nafn:')
  const tableHeaderDateOfDeath = getTableHeaderCell('Dánardagur:')

  const tableCellName = getTableCell(`
    ${name || ''}, <br />
    kt. ${nationalId || ''}, <br />
    síðasta heimilisfang:<br />
    ${address || ''}
    `)
  const tableCellDateOfDeath = getTableCell(
    dateOfDeath ? formatDate(dateOfDeath, 'd. MMMM yyyy') : '',
  )

  let settlementText = ''
  if (model.settlement?.type) {
    switch (model.settlement.type) {
      case SettlementType.DEFAULT:
        settlementText = ''
        break
      case SettlementType.UNDIVIDED:
        settlementText = `${name || ''} sat í óskiptu búi eftir  sem lést þann .`
        break
      case SettlementType.OWNER: {
        const companies = model.settlement.companies
        if (isEmpty(companies) || companies?.length === 0) {
          settlementText = ''
          break
        }

        if (companies && companies.length === 1) {
          const company = companies[0]
          settlementText = `Athygli er vakin á því að dánarbúið ber ótakmarkaða ábyrgð á skuldbindingum félagsins ${company.companyName || ''} kt. ${company.companyNationalId || ''}.`
          break
        }

        if (companies) {
          settlementText = `Athygli er vakin á því að dánarbúið ber ótakmarkaða ábyrgð á skuldbindingum félaga`
          const companyList = companies
            .map(
              (company) =>
                ` ${company.companyName || ''} kt. ${company.companyNationalId || ''}`,
            )
            .join(', ')
          settlementText += `: ${companyList}.`
        }
        break
      }
    }
  }

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

  const outro = getElement(
    `Hér með er skorað á alla þá, sem telja til skulda eða annarra réttinda á hendur framangreindu dánarbúi eða telja til eigna í umráðum þess, að lýsa kröfum sínum fyrir undirrituðum skiptastjóra í búinu innan tveggja mánaða frá fyrri birtingu þessarar innköllunar. ${getElement(`Kröfulýsingar skulu sendar skiptastjóra ${statementPrefix}${getStatementLocation()}`)}`,
  )

  return `
          ${intro}
          <table>
            <tbody>
              <tr>
                ${tableHeaderName}
                ${tableHeaderDateOfDeath}
              </tr>
              <tr>
                ${tableCellName}
                ${tableCellDateOfDeath}
              </tr>
            </tbody>
          </table>
          ${isEmpty(settlementText) ? '' : getElement(settlementText)}
          ${outro}
        `
}
