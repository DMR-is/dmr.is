import { isBase64 } from 'class-validator'

import { InternalServerErrorException } from '@nestjs/common'

import { getLogger } from '@dmr.is/logging'
import { formatDate } from '@dmr.is/utils'

import { AdvertModel, AdvertVersionEnum } from '../modules/advert/advert.model'
import { TypeIdEnum } from '../modules/type/type.model'

export const getAdvertHTMLMarkup = (
  model: AdvertModel,
  version: AdvertVersionEnum,
) => {
  const logger = getLogger('AdvertModel')
  const additionalMarkup = model.additionalText
    ? `<div class="advert__additional"><p>${model.additionalText}</p></div>`
    : ''

  const publishing = model.publications.find(
    (pub) => pub.versionLetter === version,
  )

  if (!publishing) {
    logger.debug('No publication exists with this version.', {
      version: version,
      advertId: model.id,
    })
    throw new InternalServerErrorException(
      'No publication exists with this version.',
    )
  }

  const publishingDate = publishing.publishedAt
    ? publishing.publishedAt
    : publishing.scheduledAt

  let markup = ''
  switch (model.typeId.toUpperCase()) {
    case TypeIdEnum.RECALL_BANKRUPTCY: {
      if (!model.settlement || !model.settlement.settlementDeadline) {
        throw new Error('Settlement information is missing')
      }

      if (!model.judgementDate) {
        throw new Error('Judgement date is missing')
      }

      if (!model.divisionMeetingLocation || !model.divisionMeetingDate) {
        throw new Error('Division meeting information is missing')
      }

      markup = `
          <p>Með úrskurði ${model.courtDistrict?.title} uppkveðnum ${formatDate(model.judgementDate, 'dd. MMMM yyyy')} var eftirtalið bú tekið til gjaldþrotaskipta. Sama dag var undirritaður skipaður skiptastjóri í búinu. Frestdagur við gjaldþrotaskiptin er tilgreindur við nafn viðkomandi bús.</p>
          <table>
            <tbody>
              <tr>
                <td><strong>Nafn bús:</strong></td>
                <td><strong>Frestdagur:</strong></td>
                <td><strong>Skiptafundur:</strong></td>
              </tr>
              <tr>
                <td align="left">
                  ${model.settlement?.settlementName},
                  <br />
                  kt. ${model.settlement?.settlementNationalId},
                  <br />
                  ${model.settlement?.settlementAddress}
                  <br />
                </td>
                <td align="left">
                  ${formatDate(model.settlement.settlementDeadline, 'dd. MMMM yyyy')}
                </td>
                <td align="left">
                  ${formatDate(model.divisionMeetingDate, 'EEEE')}
                  <br />
                  ${formatDate(model.divisionMeetingDate, 'dd. MMMM yyyy')}
                  <br />
                  kl. ${formatDate(model.divisionMeetingDate, 'HH:mm')}
                  <br />
                </td>
              </tr>
            </tbody>
          </table>
          <p>Hér með er skorað á alla þá, sem telja til skulda eða annarra réttinda á hendur búinu eða eigna í umráðum þess, að lýsa kröfum sínum fyrir undirrituðum skiptastjóra í búinu innan tveggja mánaða frá fyrri birtingu innköllunar þessarar.</p>
          <p>Kröfulýsingar skulu sendar skiptastjóra að ${model.settlement.liquidatorLocation}</p>
          <p>Skiptafundur til að fjalla um skrá um lýstar kröfur og ráðstöfun á eignum og réttindum búsins verður haldinn á skrifstofu skiptastjóra að ${model.divisionMeetingLocation}, á ofangreindum tíma.</p>
          <p>Komi ekkert fram um eignir í búinu mun skiptum lokið á þeim skiptafundi með vísan til 155. gr. laga nr. 21/1991 um gjaldþrotaskipti o.fl. Skrá um lýstar kröfur mun liggja frammi á skrifstofu skiptastjóra síðustu viku fyrir skiptafundinn.</p>
          `
      break
    }
    case TypeIdEnum.RECALL_DECEASED: {
      if (!model.settlement || !model.settlement.settlementDateOfDeath) {
        throw new Error('Settlement information is missing')
      }

      if (!model.judgementDate) {
        throw new Error('Judgement date is missing')
      }

      markup = `
          <p>Með úrskurði ${model.courtDistrict?.title} uppkveðnum ${formatDate(model.judgementDate, 'dd. MMMM yyyy')} var neðangreint bú tekið til opinberra skipta. Sama dag var undirritaður lögmaður skipaður skiptastjóri dánarbúsins:</p>
          <table>
            <tbody>
              <tr>
                <td><strong>Dánarbú, nafn:</strong></td>
                <td><strong>Dánardagur:</strong></td>
              </tr>
              <tr>
                <td>
                  ${model.settlement.settlementName}, <br />
                  kt. ${model.settlement.settlementNationalId}, <br />
                  síðasta heimilisfang:<br />
                  ${model.settlement.settlementAddress}
                </td>
                <td>${formatDate(model.settlement.settlementDateOfDeath, 'dd. MMMM yyyy')}</td>
              </tr>
            </tbody>
          </table>
          <p>Hér með er skorað á alla þá, sem telja til skulda eða annarra réttinda á hendur framangreindu dánarbúi eða telja til eigna í umráðum þess, að lýsa kröfum sínum fyrir undirrituðum skiptastjóra í búinu innan tveggja mánaða frá fyrri birtingu þessarar innköllunar. Kröfulýsingar skulu sendar skiptastjóra að ${model.settlement.liquidatorLocation}.</p>
          `
      break
    }
    case TypeIdEnum.DIVISION_MEETING: {
      if (!model.divisionMeetingDate || !model.divisionMeetingLocation) {
        throw new Error('Division meeting information is missing')
      }

      if (!model.settlement) {
        throw new Error('Settlement information is missing')
      }

      if (model.settlement.settlementDateOfDeath) {
        markup = `
        <p>Skiptafundur í eftirtöldu dánarbúi verður haldinn á skrifstofu skiptastjóra að ${model.divisionMeetingLocation} á neðangreindum tíma.</p>
        <table>
          <tbody>
            <tr>
              <td><strong>Dánarbú, nafn:</strong></td>
              <td><strong>Skiptafundur:</strong></td>
            </tr>
            <tr>
              <td>${model.settlement.settlementName}</td>
              <td>${formatDate(model.divisionMeetingDate, 'dd. MMMM yyyy')}</td>
            </tr>
            <tr>
              <td>kt: ${model.settlement.settlementNationalId}</td>
              <td>${formatDate(model.divisionMeetingDate, 'HH:mm')}</td>
            </tr>
            <tr>
              <td>síðasta heimilisfang:</td>
            </tr>
            <tr>
              <td>${model.settlement.settlementAddress}</td>
            </tr>
          </tbody>
        </table>
        `
        break
      }

      markup = `
        <p>Skiptafundur í eftirtöldu þrotabúi verður haldinn á skrifstofu skiptastjóra að ${model.divisionMeetingLocation} á neðangreindum tíma. Komi ekki fram ábendingar um eignir í búinu í síðasta lagi á fundinum, má vænta þess að skiptum verði lokið þar á grundvelli 155. gr. laga nr. 21/1991.</p>
        <table>
          <tbody>
            <tr>
              <td><strong>Nafn bús:</strong></td>
              <td><strong>Skiptafundur:</strong></td>
            </tr>
            <tr>
              <td>
                ${model.settlement.settlementName},<br />
                kt: ${model.settlement.settlementNationalId},<br />
                ${model.settlement.settlementAddress}</td>
              <td>
                ${formatDate(model.divisionMeetingDate, 'dd. MMMM yyyy')},<br />
                kl. ${formatDate(model.divisionMeetingDate, 'HH:mm')}
              </td>
            </tr>
          </tbody>
        </table>
      `
      break
    }
    case TypeIdEnum.DIVISION_ENDING: {
      if (!model.judgementDate) {
        throw new Error('Judgement date is missing')
      }

      if (!model.settlement) {
        throw new Error('Settlement information is missing')
      }

      markup = `
        <p>Með úrskurði héraðsdóms Reykjavíkur uppkveðnum ${formatDate(model.judgementDate, 'dd. MMMM yyyy')} var neðangreint bú tekið til gjaldþrotaskipta. Sama dag var undirritaður lögmaður skipaður skiptastjóri í þrotabúinu.</p>
        <p>Engar eignir fundust í búinu og var skiptum í því lokið 17. janúar 2025 samkvæmt 155. gr. laga nr. 21/1991 án þess að greiðsla fengist upp í lýstar kröfur, auk áfallinna vaxta og kostnaðar eftir úrskurðardag gjaldþrotaskipta.</p>
        <table>
          <tbody>
            <tr>
              <td>Nafn bús:</td>
              <td>Lýstar kröfur:</td>
            </tr>
            <tr>
              <td>
                ${model.settlement.settlementName}, <br />
                kt. ${model.settlement.settlementNationalId}
              </td>
              <td>
                kr. ${model.settlement.declaredClaims?.toLocaleString('is-IS').replaceAll(',', '.')},-
              </td>
            </tr>
          </tbody>
        </table>
      `

      break
    }
    default: {
      markup = model.content
        ? isBase64(model.content)
          ? `${Buffer.from(model.content, 'base64').toString('utf-8')}`
          : `${model.content}`
        : ''
    }
  }

  return `
  <div class="advert legal-gazette">
    <p class="advertSerial">${publishing.publishedAt ? `Útgáfud.: ${formatDate(publishingDate, 'dd. MMMM yyyy')}` : `Áætlaður útgáfud.: ${formatDate(publishingDate, 'dd. MMMM yyyy')}`}</p>
    <h1 class="advertHeading">${model.title}</h1>

    ${additionalMarkup}

    <div class="advertContent">
      ${markup}
    </div>

    <div class="advertSignature">
      <p>${model.signatureLocation}, ${formatDate(model.signatureDate, 'dd. MMMM yyyy')}</p>
      ${model.signatureOnBehalfOf ? `<p>f.h. ${model.signatureOnBehalfOf}</p>` : ''}
      <p><strong>${model.signatureName}</strong></p>
    </div>
    ${model.publicationNumber ? `<p class="advertSerial">${model.publicationNumber}${version}</p>` : `<p class="advertSerial">(Reiknast við útgáfu)${version}</p>`}
  </div>
  `
}
