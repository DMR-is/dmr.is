/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { InternalServerErrorException } from '@nestjs/common'

import { getLogger } from '@dmr.is/logging'
import { formatDate } from '@dmr.is/utils'

import { AdvertModel } from '../../../models/advert.model'
import { getElement, getTableCell, getTableHeaderCell } from '../element'

const LOGGING_CONTEXT = 'RecallDeceasedTemplate'
const logger = getLogger(LOGGING_CONTEXT)

function validateRecallDeceasedModel(model: AdvertModel) {
  if (!model.settlement) {
    logger.error('Settlement information is missing', {
      context: LOGGING_CONTEXT,
    })

    return false
  }

  if (!model.settlement.dateOfDeath) {
    logger.error('Date of death is missing', { context: LOGGING_CONTEXT })

    return false
  }

  if (!model.judgementDate) {
    logger.error('Judgement date is missing', { context: LOGGING_CONTEXT })

    return false
  }

  return true
}

export function getRecallDeceasedTemplate(model: AdvertModel): string {
  const isValid = validateRecallDeceasedModel(model)

  if (!isValid) {
    throw new InternalServerErrorException(
      'Invalid model provided for recall deceased template',
    )
  }

  const judgementDate = model.judgementDate!
  const name = model.settlement!.name
  const dateOfDeath = model.settlement!.dateOfDeath!
  const nationalId = model.settlement!.nationalId
  const address = model.settlement!.address
  const liquidatorLocation = model.settlement!.liquidatorLocation

  const intro = getElement(
    `Með úrskurði ${model.courtDistrict?.title} uppkveðnum ${formatDate(judgementDate, 'dd. MMMM yyyy')} var neðangreint bú tekið til opinberra skipta. Sama dag var undirritaður lögmaður skipaður skiptastjóri dánarbúsins:`,
  )
  const tableHeaderName = getTableHeaderCell('Dánarbú, nafn:')
  const tableHeaderDateOfDeath = getTableHeaderCell('Dánardagur:')

  const tableCellName = getTableCell(`
    ${name}, <br />
    kt. ${nationalId}, <br />
    síðasta heimilisfang:<br />
    ${address}
    `)
  const tableCellDateOfDeath = getTableCell(
    formatDate(dateOfDeath, 'dd. MMMM yyyy'),
  )

  const outro = getElement(
    `Hér með er skorað á alla þá, sem telja til skulda eða annarra réttinda á hendur framangreindu dánarbúi eða telja til eigna í umráðum þess, að lýsa kröfum sínum fyrir undirrituðum skiptastjóra í búinu innan tveggja mánaða frá fyrri birtingu þessarar innköllunar. Kröfulýsingar skulu sendar skiptastjóra að ${liquidatorLocation}.`,
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
          ${outro}
        `
}
