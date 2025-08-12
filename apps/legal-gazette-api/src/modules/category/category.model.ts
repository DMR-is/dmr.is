import { BelongsTo, Column, DataType, ForeignKey } from 'sequelize-typescript'

import { NotFoundException } from '@nestjs/common'

import { BaseEntityModel, BaseEntityTable } from '@dmr.is/shared/models/base'

import { LegalGazetteModels } from '../../lib/constants'
import { AdvertModel } from '../advert/advert.model'
import { TypeModel } from '../type/type.model'
import { CategoryDto } from './dto/category.dto'

export enum CategoryDefaultIdEnum {
  BANKRUPTCY_ADVERT = '30452623-789d-4bc8-b068-ff44b706ba8e',
  BANKRUPTCY_DIVISION_ADVERT = '5b3dded4-e6c2-411e-a9e0-213bea06af17',
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
