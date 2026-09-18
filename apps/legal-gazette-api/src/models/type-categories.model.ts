// Association annotations use a type-only alias - see `models.md`.
import {
  BelongsTo,
  Column,
  DataType,
  DefaultScope,
  ForeignKey,
  PrimaryKey,
} from 'sequelize-typescript'

import { ParanoidModel, ParanoidTable } from '@dmr.is/shared-models-base'

import { LegalGazetteModels } from '../core/constants'
import type { CategoryModel as CategoryModelRef } from './category.model'
import { CategoryModel } from './category.model'
import type { TypeModel as TypeModelRef } from './type.model'
import { TypeModel } from './type.model'
import type { TypeCategoryDto } from './type-categories.dto'

type TypeCategoriesAttributes = {
  typeId: string
  categoryId: string
  type: TypeModel
  category: CategoryModel
}

export type TypeCategoriesCreateAttributes = TypeCategoriesAttributes

@DefaultScope(() => ({
  include: [
    {
      model: TypeModel,
      as: 'type',
    },
    {
      model: CategoryModel,
      as: 'category',
    },
  ],
}))
@ParanoidTable({ tableName: LegalGazetteModels.TYPE_CATEGORIES })
export class TypeCategoriesModel extends ParanoidModel<
  TypeCategoriesAttributes,
  TypeCategoriesCreateAttributes
> {
  @PrimaryKey
  @ForeignKey(() => TypeModel)
  @Column({ type: DataType.UUID, allowNull: false })
  typeId!: string

  @PrimaryKey
  @ForeignKey(() => CategoryModel)
  @Column({ type: DataType.UUID, allowNull: false })
  categoryId!: string

  @BelongsTo(() => TypeModel)
  type!: TypeModelRef

  @BelongsTo(() => CategoryModel)
  category!: CategoryModelRef

  static fromModel(model: TypeCategoriesModel): TypeCategoryDto {
    return {
      type: model.type.fromModel(),
      category: model.category.fromModel(),
    }
  }

  fromModel(): TypeCategoryDto {
    return TypeCategoriesModel.fromModel(this)
  }
}
