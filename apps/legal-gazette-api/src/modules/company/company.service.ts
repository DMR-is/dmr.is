import { Inject, Injectable } from '@nestjs/common'

import { formatDate } from '@dmr.is/utils'

import { IAdvertService } from '../advert/advert.service.interface'
import {
  CreateAdditionalAnnouncementsDto,
  RegisterCompanyDto,
} from './dto/company.dto'
import { ICompanyService } from './company.service.interface'
import {
  formatCompanyAnnouncement as getCompanyAnnouncementMarkup,
  formatParty,
  getNextWednesday,
} from './utils'

@Injectable()
export class CompanyService implements ICompanyService {
  constructor(
    @Inject(IAdvertService) private readonly advertService: IAdvertService,
  ) {}
  async createAdditionalAnnouncements(
    body: CreateAdditionalAnnouncementsDto,
  ): Promise<void> {
    const nextWednesday = getNextWednesday()

    const { announcementMonth, announcementYear } = body

    const date = new Date(announcementYear, announcementMonth, 1)

    const intro = `<p>Eftirtalin hlutafélög og einkahlutafélög hafa sent hlutafélagaskrá tilkynningar í ${formatDate(date, 'MMMM yyyy')}, samanber skýringar á táknum hér fyrir neðan:</p>`

    const announcementsMarkup = body.announcements
      .map((an, i) =>
        getCompanyAnnouncementMarkup({
          index: i + 1,
          name: an.companyName,
          nationalId: an.companyNationalId,
          location: an.companyLocation,
          items: an.announcementItems,
        }),
      )
      .join('')

    const outro = `
    <table>
      <tbody>
        <tr>
          <td>
            A = tilkynning er varðar stjórn
          </td>
        </tr>
        <tr>
          <td>
            B = tilkynning er varðar hlutafé
          </td>
        </tr>
        <tr>
          <td>
            C = tilkynning er varðar framkvæmdastjóra
          </td>
        </tr>
        <tr>
          <td>
            D = tilkynning er varðar prókúruumboð
          </td>
        </tr>
        <tr>
          <td>
            E = tilkynning er varðar endurskoðun
          </td>
        </tr>
        <tr>
          <td>
            F = tilkynning er varðar nafn
          </td>
        </tr>
        <tr>
          <td>
            G = tilkynning er varðar heimilisfang
          </td>
        </tr>
        <tr>
          <td>
            H = tilkynning er varðar tilgang
          </td>
        </tr>
        <tr>
          <td>
            J = tilkynning er varðar afskráningu
          </td>
        </tr>
        <tr>
          <td>
            K = tilkynning er varðar firmaritun
          </td>
        </tr>
        <tr>
          <td>
            L = tilkynning er varðar viðskiptahömlur hlutabréfa
          </td>
        </tr>
        <tr>
          <td>
            M = tilkynning er varðar útibú
          </td>
        </tr>
        <tr>
          <td>
            N = tilkynning er varðar umboð
          </td>
        </tr>
        <tr>
          <td>
            O = tilkynning er varðar lausnarskyldu
          </td>
        </tr>
        <tr>
          <td>
            P = tilkynning er varðar útibússtjóra erlends hlutafélags
          </td>
        </tr>
        <tr>
          <td>
            R = breyting hlutafélags í einkahlutafélag
          </td>
        </tr>
        <tr>
          <td>
            S = breyting einkahlutafélags í hlutafélag
          </td>
        </tr>
        <tr>
          <td>
            T = tilkynning er varðar eigendur
          </td>
        </tr>
      </tbody>
    </table>
  `

    const htmlContent = `
      ${intro}
      ${announcementsMarkup}
      <br />
      ${outro}
    `

    await this.advertService.createAdvert({
      title: `Aukatilkynningar hlutafélaga`,
      typeId: '8CF1CD80-4F20-497F-8992-B32424AB82D4',
      categoryId: 'c2430ac0-a18f-4363-be88-b6de46b857b9',
      createdBy: body.responsibleParty.name,
      createdByNationalId: body.responsibleParty.nationalId,
      content: htmlContent,
      signatureDate: body.responsibleParty.signatureDate,
      signatureName: body.responsibleParty.signatureName,
      signatureLocation: body.responsibleParty.signatureLocation,
      signatureOnBehalfOf: body.responsibleParty.signatureOnBehalfOf,
      scheduledAt: [nextWednesday.toISOString()],
      caption: `${formatDate(date, 'MMMM yyyy')}`,
    })
  }

  async registerCompany(body: RegisterCompanyDto): Promise<void> {
    const nextTuesday = getNextWednesday()

    const creators = body.creators.map((c) => formatParty(c)).join(', ')

    const boardMembers = body.administration
      ? `${formatParty(body.administration.administrator)}${
          (body.administration.viceAdministration?.length || 0) > 0
            ? `, Varastjórn: ${
                body.administration.viceAdministration
                  ? body.administration.viceAdministration
                      .map((dm) => formatParty(dm))
                      .join(', ')
                  : ''
              }`
            : ''
        }`
      : ''

    const chairmen = body.chairmen
      ? `${formatParty(body.chairmen.chairman)}${
          body.chairmen.viceChairman
            ? `, Meðstjórnandi: ${formatParty(body.chairmen.viceChairman)}`
            : ''
        }${
          body.chairmen.reserveChairmen
            ? `, Varastjórn: ${body.chairmen.reserveChairmen
                .map((rc) => formatParty(rc))
                .join(', ')}`
            : ''
        }`
      : ''

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
              ${formatDate(body.boardAppointed, 'dd. MMMM yyyy')}
            </td>
          </tr>
          ${
            boardMembers.length > 0 &&
            `
              <tr>
                <td>
                  <i>Stjórnarmaður: </i>
                  ${boardMembers}
                </td>
              </tr>
            `
          }
          ${
            chairmen.length > 0 &&
            `
              <tr>
                <td>
                  <i>Formaður stjórnar: </i>
                  ${chairmen}
                </td>
              </tr>
            `
          }
          <tr>
            <td>
              <i>Firmað ritar: </i>
              ${body.signingAuthority}
            </td>
          </tr>
          <tr>
            <td>
              <i>Framkvæmdastjórn: </i>
              ${body.executiveBoard.map((eb) => formatParty(eb)).join(', ')}
            </td>
          </tr>
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
      caption: `Nýskráning hlutafélags`,
      content: htmlContent,
      signatureDate: body.responsibleParty.signatureDate,
      signatureName: body.responsibleParty.signatureName,
      signatureLocation: body.responsibleParty.signatureLocation,
      signatureOnBehalfOf: body.responsibleParty.signatureOnBehalfOf,
      scheduledAt: [nextTuesday.toISOString()],
    })
  }
}
