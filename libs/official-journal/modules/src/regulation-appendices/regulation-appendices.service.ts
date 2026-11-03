import { Op } from 'sequelize'

import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { LogAndHandle } from '@dmr.is/decorators'
import {
  AdvertStatus,
  GetRegulationAppendicesResponse,
  RegulationAppendicesItem,
} from '@dmr.is/shared-dto'
import { ResultWrapper } from '@dmr.is/types'

import { AdvertTypeModel } from '../advert-type/models'
import { caseAdditionMigrate } from '../case/migrations/case-addition.migrate'
import { CaseAdditionModel, CaseModel } from '../case/models'
import {
  AdvertDepartmentModel,
  AdvertModel,
  AdvertStatusModel,
} from '../journal/models'
import { IRegulationAppendicesService } from './regulation-appendices.service.interface'
import {
  groupSerialsByYear,
  parsePublicationNumbers,
} from './regulation-appendices.utils'

/** Regulations are published in B-deild. */
export const REGULATION_DEPARTMENT_SLUG = 'b-deild'

/**
 * Statuses an advert is publicly visible in. The route is unauthenticated, so
 * this is an allow-list: an advert in any other status is reported as not
 * found rather than having its appendices returned. Revoked adverts are
 * included on purpose - the importer decides what to do with them.
 */
export const PUBLIC_ADVERT_STATUSES = [
  AdvertStatus.Published,
  AdvertStatus.Active,
  AdvertStatus.Revoked,
  AdvertStatus.Old,
]

@Injectable()
export class RegulationAppendicesService
  implements IRegulationAppendicesService
{
  constructor(
    @InjectModel(AdvertModel)
    private readonly advertModel: typeof AdvertModel,
  ) {}

  @LogAndHandle()
  async getAppendices(
    publicationNumbers: string[],
  ): Promise<ResultWrapper<GetRegulationAppendicesResponse>> {
    const parsed = parsePublicationNumbers(publicationNumbers)

    if (!parsed.ok) {
      return ResultWrapper.err({
        code: 400,
        message: `Invalid publication number(s), expected number/year: ${parsed.invalid.join(', ')}`,
      })
    }

    const byYear = groupSerialsByYear(parsed.value)

    const adverts = await this.advertModel.findAll({
      attributes: ['id', 'serialNumber', 'publicationYear'],
      where: {
        [Op.or]: [...byYear.entries()].map(([year, serials]) => ({
          publicationYear: year,
          serialNumber: { [Op.in]: serials },
        })),
      },
      include: [
        {
          model: AdvertDepartmentModel,
          attributes: [],
          where: { slug: REGULATION_DEPARTMENT_SLUG },
          required: true,
        },
        {
          model: AdvertStatusModel,
          attributes: ['title'],
          where: { title: { [Op.in]: PUBLIC_ADVERT_STATUSES } },
          required: true,
        },
        {
          model: AdvertTypeModel,
          attributes: ['slug', 'title'],
          required: false,
        },
        {
          model: CaseModel,
          attributes: ['id'],
          required: false,
          include: [{ model: CaseAdditionModel, required: false }],
        },
      ],
    })

    // (serial_number, publication_year, department_id) is unique, so with the
    // department fixed there is at most one advert per publication number.
    const advertsByNumber = new Map(
      adverts.map((advert) => [
        `${advert.serialNumber}/${advert.publicationYear}`,
        advert,
      ]),
    )

    const items = parsed.value.map<RegulationAppendicesItem>(({ full }) => {
      const advert = advertsByNumber.get(full)

      if (!advert) {
        return {
          publicationNumber: full,
          advertId: null,
          status: null,
          type: null,
          appendices: null,
        }
      }

      // Appendices are case additions, so an advert published without a case
      // (older adverts) has nothing to report: null, meaning unknown, rather
      // than [] which would read as "has no appendices".
      const appendices = advert.case
        ? (advert.case.additions ?? [])
            .map((addition) => caseAdditionMigrate(addition))
            .sort((a, b) => a.order - b.order)
        : null

      return {
        publicationNumber: full,
        advertId: advert.id,
        status: advert.status.title,
        type: advert.type
          ? { slug: advert.type.slug, title: advert.type.title }
          : null,
        appendices,
      }
    })

    return ResultWrapper.ok({ items })
  }
}
