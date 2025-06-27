import { BelongsTo, Column, DataType, ForeignKey } from 'sequelize-typescript'

import { NotFoundException } from '@nestjs/common'

import { LegalGazetteModels } from '@dmr.is/legal-gazette/constants'
import { BaseEntityModel, BaseEntityTable } from '@dmr.is/shared/models/base'

import { AdvertModel } from '../advert/advert.model'
import { TypeModel } from '../type/type.model'
import { CategoryDto } from './dto/category.dto'

@BaseEntityTable({
  tableName: LegalGazetteModels.ADVERT_CATEGORY,
})
export class CategoryModel extends BaseEntityModel {
  @ForeignKey(() => TypeModel)
  @Column({ type: DataType.UUID, field: 'advert_type_id' })
  typeId!: string

  @BelongsTo(() => TypeModel)
  type!: TypeModel

  fromModel(): CategoryDto {
    return {
      id: this.id,
      title: this.title,
      slug: this.slug,
    }
  }

  static fromModel(model: CategoryModel): CategoryDto {
    return {
      id: model.id,
      title: model.title,
      slug: model.slug,
    }
  }

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
