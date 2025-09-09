import { BelongsToMany } from 'sequelize-typescript'

import { NotFoundException } from '@nestjs/common'

import { BaseEntityModel, BaseEntityTable } from '@dmr.is/shared/models/base'

import { LegalGazetteModels } from '../../lib/constants'
import { AdvertModel } from '../advert/advert.model'
import { TypeModel } from '../type/type.model'
import { TypeCategoriesModel } from '../type-categories/type-categories.model'
import { CategoryDto } from './dto/category.dto'

export enum CategoryDefaultIdEnum {
  BANKRUPTCY_RECALL = '30452623-789d-4bc8-b068-ff44b706ba8e',
  DECEASED_RECALL = '6b7ccba1-afd9-4eaf-adb5-297fe1cc163c',
  BANKRUPTCY_DIVISION_MEETING = '23064adc-db71-48ad-aeae-6044f0567ff9',
  DECEASED_DIVISION_MEETING = '94effe96-d167-4edb-b776-99eb9f92d7da',
  DIVISION_ENDING = '7cd93ede-27e9-46ac-bf43-2259ce6dd8ff',
}

@BaseEntityTable({
  tableName: LegalGazetteModels.ADVERT_CATEGORY,
})
export class CategoryModel extends BaseEntityModel<CategoryDto> {
  @BelongsToMany(() => TypeModel, { through: () => TypeCategoriesModel })
  types!: TypeModel[]
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
