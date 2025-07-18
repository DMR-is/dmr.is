import { BelongsTo, Column, DataType, ForeignKey } from 'sequelize-typescript'

import { NotFoundException } from '@nestjs/common'

import { LegalGazetteModels } from '@dmr.is/legal-gazette/constants'
import { BaseEntityModel, BaseEntityTable } from '@dmr.is/shared/models/base'

import { AdvertModel } from '../advert/advert.model'
import { TypeModel } from '../type/type.model'
import { CategoryDto } from './dto/category.dto'

export enum CategoryDefaultIdEnum {
  BANKRUPTCY_ADVERT = '30452623-789d-4bc8-b068-ff44b706ba8e',
  DECEASED_ADVERT = 'todo:replace-with-deceased-advert-id',
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
