import { BelongsTo, Column, DataType, ForeignKey } from 'sequelize-typescript'

import { NotFoundException } from '@nestjs/common'

import { BaseEntityModel, BaseEntityTable } from '@dmr.is/shared/models/base'

import { LegalGazetteModels } from '../../lib/constants'
import { AdvertModel } from '../advert/advert.model'
import { TypeModel } from '../type/type.model'
import { CategoryDto } from './dto/category.dto'

export enum CategoryDefaultIdEnum {
  BANKRUPTCY_RECALL = '30452623-789d-4bc8-b068-ff44b706ba8e',
  DECEASED_RECALL = 'b0c8f1d2-3c4e-4f5a-8b6c-7d8e9f0a1b2c',
  BANKRUPTCY_DIVISION_MEETING = '23064adc-db71-48ad-aeae-6044f0567ff9',
  DECEASED_DIVISION_MEETING = '6b7ccba1-afd9-4eaf-adb5-297fe1cc163c',
  DIVISION_ENDING = '7cd93ede-27e9-46ac-bf43-2259ce6dd8ff',
}

@BaseEntityTable({
  tableName: LegalGazetteModels.ADVERT_CATEGORY,
})
export class CategoryModel extends BaseEntityModel<CategoryDto> {
  @ForeignKey(() => TypeModel)
  @Column({ type: DataType.UUID, field: 'advert_type_id' })
  typeId!: string

  @BelongsTo(() => TypeModel)
  type!: TypeModel

  static async setAdvertCategory(advertId: string, categoryId: string) {
    const advert = await AdvertModel.unscoped().findByPk(advertId, {
      attributes: ['id', 'statusId'],
    })

    if (!advert) {
      throw new NotFoundException(`Advert not found`)
    }

    advert.categoryId = categoryId
    await advert.save()
  }
}
