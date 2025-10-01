import { Inject, Injectable } from '@nestjs/common'

import { formatDate } from '@dmr.is/utils'

import { IAdvertService } from '../advert/advert.service.interface'
import {
  RegisterCompanyFirmaskraDto,
  RegisterCompanyHlutafelagDto,
} from './dto/company.dto'
import { ICompanyService } from './company.service.interface'
import { formatParty, getNextWednesday } from './utils'

@Injectable()
export class CompanyService implements ICompanyService {
  constructor(
    @Inject(IAdvertService) private readonly advertService: IAdvertService,
  ) {}
  registerCompanyFirmaskra(body: RegisterCompanyFirmaskraDto): Promise<void> {
    const nextWednesday = getNextWednesday()

    const creators = body.creators.map((c) => formatParty(c)).join(', ')
    const procurators = body.procurationHolders
      ? body.procurationHolders.map((ph) => formatParty(ph)).join(', ')
      : ''
    const additionalProperties = body.additionalProperties
      ? body.additionalProperties.map((ap) => ({
          key: ap.key,
          value: formatParty(ap.value),
        }))
      : []

    const htmlContent = `
      <table>
        <tbody>
          <tr>
            <td>
              <i>Nafn</i>
              ${body.name}
            </td>
          </tr>
          <tr>
            <td>
              <i>Kt.: </i>
              ${body.nationalId}
            </td>
          </tr>
          <tr>
            <td>
              <i>Dagsetning samþykkta: </i>
              ${formatDate(body.approvedDate, 'dd. MMMM yyyy')}
            </td>
          </tr>
          <tr>
            <td>
              <i>Heimilisfang: </i>
              ${body.registeredAddress}
            </td>
          </tr>
          <tr>
            <td>
              <i>Eigendur: </i>
              ${creators}
            </td>
          </tr>
          <tr>
            <td>
              <i>Tilgangur</i>
              ${body.purpose}
            </td>
          </tr>
          <tr>
            <td>
              <i>Skattaðlid: </i>
              ${body.taxMembership}
            </td>
          </tr>
          <tr>
            <td>
              <i>Firmaritun: </i>
              ${body.firmWriting}
            </td>
          </tr>
          <tr>
            <td>
              <i>Prókúruumboð: </i>
              ${procurators}
            </td>
          </tr>
          ${additionalProperties
            .map(
              ({ key, value }) => `
              <tr>
                <td>
                  <i>${key}: </i>
                  ${value}
                </td>
              </tr>
            `,
            )
            .join('')}
        </tbody>
      </table>
    `

    return this.advertService.createAdvert({
      title: `Fyrirtækjaskrá - nýskráning`,
      typeId: 'B390117B-A39A-4292-AE59-91295190F57D',
      categoryId: '6FB035BF-028D-4BFA-937F-32A7AA592F16',
      createdBy: body.responsibleParty.name,
      createdByNationalId: body.responsibleParty.nationalId,
      caption: body.name,
      content: htmlContent,
      signatureDate: body.responsibleParty.signatureDate,
      signatureName: body.responsibleParty.signatureName,
      signatureLocation: body.responsibleParty.signatureLocation,
      signatureOnBehalfOf: body.responsibleParty.signatureOnBehalfOf,
      scheduledAt: [nextWednesday.toISOString()],
    })
  }

  async registerCompanyHlutafelag(
    body: RegisterCompanyHlutafelagDto,
  ): Promise<void> {
    const nextWednesday = getNextWednesday()

    const creators = body.creators.map((c) => formatParty(c)).join(', ')
    const boardMembers = body.board.members
      .map((m) => formatParty(m))
      .join(', ')

    const executiveBoardMembers =
      body.board.executiveBoardMembers?.map((m) => formatParty(m)).join(', ') ??
      ''

    const htmlContent = `
      <table>
        <tbody>
          <tr>
            <td>
              <i>Félagið heitir: </i>
              ${body.name}
            </td>
          </tr>
          <tr>
            <td>
              <i>Kt.: </i>
              ${body.nationalId}
            </td>
          </tr>
          <tr>
            <td>
              <i>Heimili og varnarþing: </i>
              ${body.registeredAddress}
            </td>
          </tr>
          <tr>
            <td>
              <i>Dagsetning samþykkta er: </i>
              ${formatDate(body.approvedDate, 'dd. MMMM yyyy')}
            </td>
          </tr>
          <tr>
            <td>
              <i>Stofnendur: </i>
              ${creators}
            </td>
          </tr>
          <tr>
            <td>
              <i>Stjórn félagsins skipa skv. fundi dags: </i>
              ${formatDate(body.board.appointedDate, 'dd. MMMM yyyy')}
            </td>
          </tr>
          <tr>
            <td>
              ${boardMembers}
            </td>
          </tr>
          <tr>
            <td>
              <i>Firmað ritar: </i>
              ${body.theFirmWrites}
            </td>
          </tr>
          ${
            executiveBoardMembers.length > 0 &&
            `<tr>
              <td>
                <i>Framkvæmdarstjórn</i>
                ${executiveBoardMembers}
              </td>
            </tr>`
          }
          <tr>
            <td>
              <i>Prókúruumboð: </i>
              ${body.procurationHolders?.map((ph) => formatParty(ph)).join(', ') || ''}
            </td>
          </tr>
          <tr>
            <td>
              <i>Skoðunarmaður/endurskoðandi: </i>
              ${body.auditors.map((a) => formatParty(a)).join(', ')}
            </td>
          </tr>
          <tr>
            <td>
              <i>Hlutafé kr.: </i>
              ${body.capital}
            </td>
          </tr>
          <tr>
            <td>
              <i>Tilgangur: </i>
              ${body.purpose}
            </td>
          </tr>
          <tr>
            <td>
              <i>Hömlur á meðferð hlutabréfa: </i>
              ${body.benefits ? 'Já' : 'Nei'}
            </td>
          </tr>
          <tr>
            <td>
              <i>Lausnarskylda á hlutabréfum: </i>
              ${body.liquidationObligation ? 'Já' : 'Nei'}
            </td>
          </tr>
        </tbody>
      </table>
    `

    await this.advertService.createAdvert({
      title: `Hlutafélagaskrá - nýskráning`,
      typeId: '4E8DEC71-5270-49D8-BB67-B9A2CA5BEEAC',
      categoryId: 'C2430AC0-A18F-4363-BE88-B6DE46B857B9',
      createdBy: body.responsibleParty.name,
      createdByNationalId: body.responsibleParty.nationalId,
      caption: body.name,
      content: htmlContent,
      signatureDate: body.responsibleParty.signatureDate,
      signatureName: body.responsibleParty.signatureName,
      signatureLocation: body.responsibleParty.signatureLocation,
      signatureOnBehalfOf: body.responsibleParty.signatureOnBehalfOf,
      scheduledAt: [nextWednesday.toISOString()],
    })
  }
}
