import { HasMany } from 'sequelize-typescript'

import { NotFoundException } from '@nestjs/common'

import { LegalGazetteModels } from '@dmr.is/legal-gazette/constants'
import { BaseEntityModel, BaseEntityTable } from '@dmr.is/shared/models/base'

import { AdvertModel } from '../advert/advert.model'

export enum AdvertStatusIdEnum {
  SUBMITTED = 'cd3bf301-52a1-493e-8c80-a391c310c840',
  READY_FOR_PUBLICATION = 'a2f3b1c4-2d5e-4a7b-8c6f-9d1e0f3a2b8c',
  PUBLISHED = 'bd835a1d-0ecb-4aa4-9910-b5e60c30dced',
  REJECTED = 'f3a0b1c4-2d5e-4a7b-8c6f-9d1e0f3a2b8c',
  WITHDRAWN = 'e2f3b1c4-2d5e-4a7b-8c6f-9d1e0f3a2b8c',
}

@BaseEntityTable({ tableName: LegalGazetteModels.ADVERT_STATUS })
export class AdvertStatusModel extends BaseEntityModel {
  @HasMany(() => AdvertModel, {
    foreignKey: 'statusId',
  })
  adverts!: AdvertModel[]

  static async setAdvertStatus(advertId: string, statusId: AdvertStatusIdEnum) {
    const advert = await AdvertModel.unscoped().findByPk(advertId, {
      attributes: ['id'],
    })

    if (!advert) {
      throw new NotFoundException(`Advert not found`)
    }

    advert.statusId = statusId
    await advert.save()
  }
}
