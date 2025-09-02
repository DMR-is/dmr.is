import { formatDate } from '@dmr.is/utils'

import { AdvertModel } from '../modules/advert/advert.model'
import { CategoryDefaultIdEnum } from '../modules/category/category.model'

/*

.advert {
  fontSize: 12pt;
}

.advertSerial {
  fontSize: 10pt;
  textAlign: right;
  marginBlock: 0;
}

.advertHeading {
  fontWeight: bold;
  marginBottom: 4px;
}

p {
  textAlign: justify;
  marginBlock: 1em;
}

.advertSignature p {
  textAlign: right;
  marginBlock: 0;
}
*/

export const getAdvertHTMLMarkup = (model: AdvertModel) => {
  const additionalMarkup = model.additionalText
    ? `<div class="advert__additional"><p>${model.additionalText}</p></div>`
    : ''

  const latestPublished = model.publications.filter(
    (pub) => pub.publishedAt !== null,
  )

  const publishingDate: Date =
    latestPublished.length > 0
      ? // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        latestPublished[latestPublished.length - 1].publishedAt!
      : model.publications[0].scheduledAt

  let markup = ''

  switch (model.categoryId) {
    case CategoryDefaultIdEnum.BANKRUPTCY_RECALL: {
      if (!model.settlement || !model.settlement.settlementDeadline) {
        throw new Error('Settlement information is missing')
      }

      markup = `
          <p>Með úrskurði héraðsdóms Reykjaness uppkveðnum *DAGSETNINGU VANTAR* var eftirtalið bú tekið til gjaldþrotaskipta. Sama dag var undirritaður skipaður skiptastjóri í búinu. Frestdagur við gjaldþrotaskiptin er tilgreindur við nafn viðkomandi bús.</p>
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
                  ${model.settlement?.settlementAddress},
                  <br />
                </td>
                <td align="left">
                  ${formatDate(model.settlement.settlementDeadline, 'dd. MMMM yyyy')}
                </td>
                <td align="left">
                  miðvikudaginn
                  <br />
                  17. september 2025,
                  <br />
                  kl. 14.00
                  <br />
                </td>
              </tr>
            </tbody>
          </table>
          <p>Hér með er skorað á alla þá, sem telja til skulda eða annarra réttinda á hendur búinu eða eigna í umráðum þess, að lýsa kröfum sínum fyrir undirrituðum skiptastjóra í búinu innan tveggja mánaða frá fyrri birtingu innköllunar þessarar.</p>
          <p>Kröfulýsingar skulu sendar skiptastjóra að ${model.settlement.liquidatorLocation}</p>
          <p>Skiptafundur til að fjalla um skrá um lýstar kröfur og ráðstöfun á eignum og réttindum búsins verður haldinn á skrifstofu skiptastjóra að ${model.settlement.liquidatorLocation}, á ofangreindum tíma.</p>
          <p>Komi ekkert fram um eignir í búinu mun skiptum lokið á þeim skiptafundi með vísan til 155. gr. laga nr. 21/1991 um gjaldþrotaskipti o.fl. Skrá um lýstar kröfur mun liggja frammi á skrifstofu skiptastjóra síðustu viku fyrir skiptafundinn.</p>
          `
      break
    }
    case CategoryDefaultIdEnum.DECEASED_RECALL: {
      if (!model.settlement || !model.settlement.settlementDateOfDeath) {
        throw new Error('Settlement information is missing')
      }

      markup = `
          <p>Með úrskurði héraðsdóms Reykjavíkur uppkveðnum *DAGSETNINGU VANTAR* var neðangreint bú tekið til opinberra skipta. Sama dag var undirritaður lögmaður skipaður skiptastjóri dánarbúsins:</p>
          <table>
            <tbody>
              <tr>
                <td><strong>Dánarbú, nafn:</strong></td>
                <td><strong>Dánardagur:</strong></td>
              </tr>
              <tr>
                <td>${model.settlement.settlementName}</td>
                <td>${formatDate(model.settlement.settlementDateOfDeath, 'dd. MMMM yyyy')}</td>
              </tr>
              <tr>
                <td>kt. ${model.settlement.settlementNationalId},</td>
              </tr>
              <tr>
                <td>síðasta heimilisfang:</td>
              </tr>
              <tr>
                <td>${model.settlement.settlementAddress}</td>
              </tr>
            </tbody>
          </table>
          <p>Hér með er skorað á alla þá, sem telja til skulda eða annarra réttinda á hendur framangreindu dánarbúi eða telja til eigna í umráðum þess, að lýsa kröfum sínum fyrir undirrituðum skiptastjóra í búinu innan tveggja mánaða frá fyrri birtingu þessarar innköllunar. Kröfulýsingar skulu sendar skiptastjóra að ${model.settlement.liquidatorLocation}.</p>
          `
      break
    }
    default: {
      markup = `${model.content}`
    }
  }

  return `
  <div class="advert">
    <p class="advertSerial">${latestPublished.length > 0 ? `Útgáfud.: ${formatDate(publishingDate, 'dd. MMMM yyyy')}` : `Áætlaður útgáfud.: ${formatDate(publishingDate, 'dd. MMMM yyyy')}`}</p>
    <h1 class="advertHeading">${model.title}</h1>

    ${additionalMarkup}

    <div class="advertContent">
      ${markup}
    </div>

    <div class="advertSignature">
      <p>${model.signatureLocation}, ${formatDate(model.signatureDate, 'dd. MMMM yyyy')}</p>
      ${model.signatureOnBehalfOf ? `<p>${model.signatureOnBehalfOf}</p>` : ''}
      <p><strong>${model.signatureName}</strong></p>
    </div>
    <p class="advertSerial">${model.case.caseNumber}${model.version}</p>
  </div>
  `
}
