import { BelongsToMany, Column, DataType } from 'sequelize-typescript'

import { BaseEntityModel, BaseEntityTable } from '@dmr.is/shared-models-base'

import { LegalGazetteModels } from '../core/constants'
import { TypeIdEnum } from '../core/enums/type-id.enum'
import { BaseEntityDto } from '../modules/base-entity/dto/base-entity.dto'
import { AdvertTypeFeeCodeModel } from './advert-type-fee-code.model'
import { CategoryModel } from './category.model'
import { FeeCodeModel } from './fee-code.model'
import type { TypeWithCategoriesDto } from './type-categories.dto'
import { TypeCategoriesModel } from './type-categories.model'

export { TypeIdEnum }

@BaseEntityTable({
  tableName: LegalGazetteModels.ADVERT_TYPE,
})
export class TypeModel extends BaseEntityModel<TypeDto> {
  @BelongsToMany(() => CategoryModel, { through: () => TypeCategoriesModel })
  categories!: CategoryModel[]

  // This is always a array with one element, we need to use BelongsToMany to get the join table
  @BelongsToMany(() => FeeCodeModel, { through: () => AdvertTypeFeeCodeModel })
  feeCode?: FeeCodeModel[]

  // Non-selectable (legacy) types are excluded from the create-flow dropdowns
  // but remain valid for existing adverts and search facets.
  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  active!: boolean

  static fromModelWithCategories(model: TypeModel): TypeWithCategoriesDto {
    return {
      id: model.id,
      title: model.title,
      slug: model.slug,
      categories: model.categories.map((category) => category.fromModel()),
    }
  }

  fromModelWithCategories(): TypeWithCategoriesDto {
    return TypeModel.fromModelWithCategories(this)
  }
}

export class TypeDto extends BaseEntityDto {}
