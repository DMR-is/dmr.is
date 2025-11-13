import { BelongsToMany } from 'sequelize-typescript'

import { NotFoundException } from '@nestjs/common'

import { BaseEntityModel, BaseEntityTable } from '@dmr.is/shared/models/base'

import { LegalGazetteModels } from '../lib/constants'
import { CategoryDto } from '../modules/category/dto/category.dto'
import { AdvertModel } from './advert.model'
import { TypeModel } from './type.model'
import { TypeCategoriesModel } from './type-categories.model'

export enum CategoryDefaultIdEnum {
  RECALLS = '7D0E4B20-2FDD-4CA9-895B-9E7792ECA6E5',
  DIVISION_MEETINGS = 'C60E266F-E3F4-4B54-B1AE-565AA30962C4',
  DIVISION_ENDINGS = 'E99EC08C-7467-4B4F-8E72-1496CA61C9CC',
  FORECLOSURES = '3B372DD8-EDE5-4231-8616-6CB413BF8E2D',
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
