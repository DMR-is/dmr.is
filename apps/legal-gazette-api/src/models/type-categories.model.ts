import {
  BelongsTo,
  Column,
  DataType,
  DefaultScope,
  ForeignKey,
  PrimaryKey,
} from 'sequelize-typescript'

import { BaseModel, BaseTable } from '@dmr.is/shared/models/base'

import { LegalGazetteModels } from '../lib/constants'
import { CategoryDto } from '../modules/category/dto/category.dto'
import { TypeDto } from '../modules/type/dto/type.dto'
import { CategoryModel } from './category.model'
import { TypeModel } from './type.model'

type TypeCategoriesAttributes = {
  typeId: string
  categoryId: string
  type: TypeModel
  category: CategoryModel
}

type TypeCategory = {
  type: TypeDto
  category: CategoryDto
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
@BaseTable({ tableName: LegalGazetteModels.TYPE_CATEGORIES })
export class TypeCategoriesModel extends BaseModel<
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
  type!: TypeModel

  @BelongsTo(() => CategoryModel)
  category!: CategoryModel

  static fromModel(model: TypeCategoriesModel): TypeCategory {
    return {
      type: model.type.fromModel(),
      category: model.category.fromModel(),
    }
  }

  fromModel(): TypeCategory {
    return TypeCategoriesModel.fromModel(this)
  }
}
