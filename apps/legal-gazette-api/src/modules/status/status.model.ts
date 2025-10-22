import { Column, DataType, HasMany } from 'sequelize-typescript'

import { BaseModel, BaseTable } from '@dmr.is/shared/models/base'

import { LegalGazetteModels } from '../../lib/constants'
import { AdvertModel } from '../advert/advert.model'
import { StatusDto } from './dto/status.dto'

export enum StatusIdEnum {
  SUBMITTED = 'cd3bf301-52a1-493e-8c80-a391c310c840',
  IN_PROGRESS = '7ef679c4-4f66-4892-b6ad-ee05e0be4359',
  READY_FOR_PUBLICATION = 'a2f3b1c4-2d5e-4a7b-8c6f-9d1e0f3a2b8c',
  PUBLISHED = 'bd835a1d-0ecb-4aa4-9910-b5e60c30dced',
  REJECTED = 'f3a0b1c4-2d5e-4a7b-8c6f-9d1e0f3a2b8c',
  WITHDRAWN = 'e2f3b1c4-2d5e-4a7b-8c6f-9d1e0f3a2b8c',
}
export enum StatusEnum {
  SUBMITTED = 'Innsent',
  IN_PROGRESS = 'Í vinnslu',
  READY_FOR_PUBLICATION = 'Tilbúið til útgáfu',
  PUBLISHED = 'Útgefið',
  REJECTED = 'Hafnað',
  REVOKED = 'Afturkallað',
}

type StatusAttributes = {
  id: StatusIdEnum
  title: StatusEnum
  slug: string
}

@BaseTable({ tableName: LegalGazetteModels.ADVERT_STATUS })
export class StatusModel extends BaseModel<StatusAttributes, StatusAttributes> {
  @Column({
    type: DataType.ENUM(...Object.values(StatusIdEnum)),
    allowNull: false,
    primaryKey: true,
  })
  id!: StatusIdEnum

  @Column({
    type: DataType.ENUM(...Object.values(StatusEnum)),
    allowNull: false,
  })
  title!: StatusEnum

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  slug!: string

  @HasMany(() => AdvertModel, {
    foreignKey: 'statusId',
  })
  adverts!: AdvertModel[]

  static async setAdvertStatus(advertId: string, statusId: StatusIdEnum) {
    const advert = await AdvertModel.unscoped().findByPkOrThrow(advertId, {
      attributes: ['id', 'statusId'],
      include: [StatusModel],
    })

    await advert.update({ statusId })
  }

  static fromModel(model: StatusModel): StatusDto {
    return {
      id: model.id,
      title: model.title,
      slug: model.slug,
    }
  }

  fromModel(): StatusDto {
    return StatusModel.fromModel(this)
  }
}
