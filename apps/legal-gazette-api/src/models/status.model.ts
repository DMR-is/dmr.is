import { Column, DataType, HasMany } from 'sequelize-typescript'

import { BaseModel, BaseTable } from '@dmr.is/shared-models-base'

import { LegalGazetteModels } from '../core/constants'
import { StatusEnum, StatusIdEnum } from '../core/enums/status.enum'
import { BaseEntityDto } from '../modules/base-entity/dto/base-entity.dto'
import { AdvertModel } from './advert.model'

// Re-export enums for backwards compatibility - circular dependency issues
export { StatusIdEnum, StatusEnum }

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
    const advert = await AdvertModel.findByPkOrThrow(advertId, {
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

export class StatusDto extends BaseEntityDto {}
