// Association annotations use a type-only alias - see `src/models.md`.
import {
  BelongsTo,
  Column,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript'

import type { AdvertCategoryModel as AdvertCategoryModelRef } from './advert-category.model'
import { AdvertCategoryModel } from './advert-category.model'
import type { AdvertMainCategoryModel as AdvertMainCategoryModelRef } from './advert-main-category.model'
import { AdvertMainCategoryModel } from './advert-main-category.model'

@Table({ tableName: 'category_categories', timestamps: false })
export class AdvertCategoryCategoriesModel extends Model {
  @PrimaryKey
  @ForeignKey(() => AdvertMainCategoryModel)
  @Column({
    allowNull: false,
    field: 'advert_main_category_id',
  })
  mainCategoryId!: string

  @PrimaryKey
  @ForeignKey(() => AdvertCategoryModel)
  @Column({
    allowNull: false,
    field: 'advert_category_id',
  })
  categoryId!: string

  @BelongsTo(() => AdvertMainCategoryModel)
  mainCategory!: AdvertMainCategoryModelRef

  @BelongsTo(() => AdvertCategoryModel)
  category!: AdvertCategoryModelRef
}
