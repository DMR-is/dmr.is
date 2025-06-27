import { HasMany } from 'sequelize-typescript'

import { BadRequestException, NotFoundException } from '@nestjs/common'

import { LegalGazetteModels } from '@dmr.is/legal-gazette/constants'
import { BaseEntityModel, BaseEntityTable } from '@dmr.is/shared/models/base'

import { AdvertModel, AdvertVersionEnum } from '../advert/advert.model'

export enum StatusIdEnum {
  SUBMITTED = 'cd3bf301-52a1-493e-8c80-a391c310c840',
  READY_FOR_PUBLICATION = 'a2f3b1c4-2d5e-4a7b-8c6f-9d1e0f3a2b8c',
  PUBLISHED = 'bd835a1d-0ecb-4aa4-9910-b5e60c30dced',
  REJECTED = 'f3a0b1c4-2d5e-4a7b-8c6f-9d1e0f3a2b8c',
  WITHDRAWN = 'e2f3b1c4-2d5e-4a7b-8c6f-9d1e0f3a2b8c',
}

@BaseEntityTable({ tableName: LegalGazetteModels.ADVERT_STATUS })
export class StatusModel extends BaseEntityModel {
  @HasMany(() => AdvertModel, {
    foreignKey: 'statusId',
  })
  adverts!: AdvertModel[]

  static async setAdvertStatus(advertId: string, statusId: StatusIdEnum) {
    const advert = await AdvertModel.unscoped().findByPk(advertId, {
      attributes: ['id', 'caseId', 'version', 'statusId'],
    })

    if (!advert) {
      throw new NotFoundException(`Advert not found`)
    }

    const siblings = await AdvertModel.unscoped().findAll({
      attributes: ['id', 'caseId', 'version', 'statusId'],
      where: {
        caseId: advert?.caseId,
      },
    })

    if (statusId === StatusIdEnum.SUBMITTED && siblings.length > 0) {
      switch (advert.version) {
        case AdvertVersionEnum.A: {
          // mark all as submitted
          siblings.forEach(async (sibling) => {
            await sibling.update({
              statusId: StatusIdEnum.SUBMITTED,
            })
          })
          break
        }
        case AdvertVersionEnum.B: {
          siblings.forEach(async (sibling) => {
            if (sibling.version !== AdvertVersionEnum.A) {
              await sibling.update({
                statusId: StatusIdEnum.SUBMITTED,
              })
            }
          })
          break
        }
      }
    }

    if (statusId === StatusIdEnum.READY_FOR_PUBLICATION) {
      // is previous sibling ready for publication or published?
      switch (advert.version) {
        case AdvertVersionEnum.A: {
          await advert.update({
            statusId: StatusIdEnum.READY_FOR_PUBLICATION,
          })
          break
        }
        case AdvertVersionEnum.B: {
          const canProceed = siblings.find(
            (sibling) =>
              (sibling.version === AdvertVersionEnum.A &&
                sibling.statusId === StatusIdEnum.PUBLISHED) ||
              sibling.statusId === StatusIdEnum.READY_FOR_PUBLICATION,
          )

          if (!canProceed) {
            this.logger.warn(
              `Advert cannot be set to READY_FOR_PUBLICATION because previous version A is not published or ready for publication.`,
              {
                advertId: advert.id,
                caseId: advert.caseId,
                version: advert.version,
                statusId: advert.statusId,
              },
            )
            throw new BadRequestException(
              `Advert cannot be set to READY_FOR_PUBLICATION because previous version A is not published or ready for publication.`,
            )
          }

          await advert.update({ statusId: StatusIdEnum.READY_FOR_PUBLICATION })

          break
        }
        case AdvertVersionEnum.C: {
          const canProceed = siblings.find(
            (sibling) =>
              (sibling.version === AdvertVersionEnum.B &&
                sibling.statusId === StatusIdEnum.PUBLISHED) ||
              sibling.statusId === StatusIdEnum.READY_FOR_PUBLICATION,
          )

          if (!canProceed) {
            this.logger.warn(
              `Advert cannot be set to READY_FOR_PUBLICATION because previous version B is not published or ready for publication.`,
              {
                advertId: advert.id,
                caseId: advert.caseId,
                version: advert.version,
                statusId: advert.statusId,
              },
            )
            throw new BadRequestException(
              `Advert cannot be set to READY_FOR_PUBLICATION because previous version B is not published or ready for publication.`,
            )
          }

          await advert.update(
            { statusId: StatusIdEnum.READY_FOR_PUBLICATION },
            {
              returning: false,
            },
          )

          break
        }
      }
    }
  }
}
