/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { isDefined } from 'class-validator'

import { getLogger } from '@dmr.is/logging'
import { formatDate } from '@dmr.is/utils'

import { AdvertModel } from '../../../models/advert.model'
import { getElement, getTableCell, getTableHeaderCell } from '../element'

const LOGGING_CONTEXT = 'DivisionEndingTemplate'
const logger = getLogger(LOGGING_CONTEXT)

function validateDivisionEnding(model: AdvertModel): boolean {
  if (!isDefined(!model.judgementDate)) {
    logger.error('Judgement date is not provided', {
      context: LOGGING_CONTEXT,
    })
    return false
  }

  if (!isDefined(!model.settlement)) {
    logger.error('Settlement is not provided', {
      context: LOGGING_CONTEXT,
    })
    return false
  }

  if (!isDefined(!model.settlement?.name)) {
    logger.error('Settlement name is not provided', {
      context: LOGGING_CONTEXT,
    })
    return false
  }

  if (!isDefined(!model.settlement?.nationalId)) {
    logger.error('Settlement national ID is not provided', {
      context: LOGGING_CONTEXT,
    })
    return false
  }

  if (!isDefined(!model.settlement?.declaredClaims)) {
    logger.error('Settlement declared claims are not provided', {
      context: LOGGING_CONTEXT,
    })
    return false
  }

  return true
}

export function getDivisionEndingTemplate(model: AdvertModel): string {
  const isValid = validateDivisionEnding(model)

  if (!isValid) {
    throw new Error('Division ending data not provided')
  }

  const judgmentDate = model.judgementDate!
  const name = model.settlement!.name!
  const nationalId = model.settlement!.nationalId!
  const declaredClaims = model.settlement!.declaredClaims!

  const intro = `
    ${getElement(`Með úrskurði héraðsdóms Reykjavíkur uppkveðnum ${formatDate(judgmentDate, 'dd. MMMM yyyy')} var neðangreint bú tekið til gjaldþrotaskipta. Sama dag var undirritaður lögmaður skipaður skiptastjóri í þrotabúinu.`)}
    ${getElement(`Engar eignir fundust í búinu og var skiptum í því lokið 17. janúar 2025 samkvæmt 155. gr. laga nr. 21/1991 án þess að greiðsla fengist upp í lýstar kröfur, auk áfallinna vaxta og kostnaðar eftir úrskurðardag gjaldþrotaskipta.`)}
  `

  const tableHeaderName = getTableHeaderCell('Nafn bús:')
  const declaredClaimsHeader = getTableHeaderCell('Lýstar kröfur:')

  const settlementCell = getTableCell(`
      ${name}, <br />
      kt. ${nationalId}
    `)

  const declaredClaimsCell = getTableCell(`
      kr. ${declaredClaims.toLocaleString('is-IS').replaceAll(',', '.')},
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
