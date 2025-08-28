import {
  BeforeUpdate,
  BelongsTo,
  Column,
  DataType,
  DefaultScope,
  ForeignKey,
} from 'sequelize-typescript'

import { BadRequestException } from '@nestjs/common'

import { BaseModel, BaseTable } from '@dmr.is/shared/models/base'

import { LegalGazetteModels } from '../../../lib/constants'
import { validateAdvertStatus } from '../../../lib/utils'
import { AdvertModel } from '../advert.model'
import { CommonAdvertDto } from './dto/common-advert.dto'

type CommonAdvertAttributes = {
  advertId: string
  islandIsApplicationId?: string
  caption: string
}

export type CommonAdvertCreateAttributes = {
  advertId?: string
  islandIsApplicationId?: string
  caption: string
}

@BaseTable({ tableName: LegalGazetteModels.COMMON_ADVERT })
@DefaultScope(() => ({
  attributes: ['id', 'advertId', 'caption'],
}))
export class CommonAdvertModel extends BaseModel<
  CommonAdvertAttributes,
  CommonAdvertCreateAttributes
> {
  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: 'advert_id',
  })
  @ForeignKey(() => AdvertModel)
  advertId!: string

  @Column({
    type: DataType.UUID,
    field: 'island_is_application_id',
  })
  island_is_application_id?: string

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    field: 'caption',
  })
  caption!: string

  @BelongsTo(() => AdvertModel, { foreignKey: 'advertId' })
  advert?: AdvertModel

  @BeforeUpdate
  static validateAdvertStatus(instance: CommonAdvertModel): void {
    if (!instance.advert?.statusId) {
      this.logger.warn('Cannot update common advert without advert status id')

      throw new BadRequestException('Cannot update advert in this status')
    }

    validateAdvertStatus(instance.advert)
  }

  static fromModel(model: CommonAdvertModel): CommonAdvertDto {
    return {
      caption: model.caption,
    }
  }

  fromModel(): CommonAdvertDto {
    return CommonAdvertModel.fromModel(this)
  }
}
