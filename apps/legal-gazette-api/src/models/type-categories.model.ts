import {
  BelongsTo,
  Column,
  DataType,
  DefaultScope,
  ForeignKey,
  PrimaryKey,
} from 'sequelize-typescript'

import { ApiDto, ApiDtoArray } from '@dmr.is/decorators'
import { BaseModel, BaseTable } from '@dmr.is/shared-models-base'

import { LegalGazetteModels } from '../core/constants'
import { BaseEntityDto } from '../modules/base-entity/dto/base-entity.dto'
import { CategoryDto, CategoryModel } from './category.model'
import { TypeDto, TypeModel } from './type.model'

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

export class TypeCategoryDto {
  @ApiDto(TypeDto)
  type!: TypeDto

  @ApiDto(CategoryDto)
  category!: CategoryDto
}

export class TypeWithCategoriesDto extends BaseEntityDto {
  @ApiDtoArray(CategoryDto)
  categories!: CategoryDto[]
}
