import {
  BelongsTo,
  Column,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript'

import { OfficialJournalModels } from '../constants'
import { AdvertCategoryModel } from './advert-category.model'
import { AdvertMainCategoryModel } from './advert-main-category.model'

@Table({
  tableName: OfficialJournalModels.MAIN_CATEGORY_CATEGORIES,
  timestamps: false,
})
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
  mainCategory!: AdvertMainCategoryModel

  @BelongsTo(() => AdvertCategoryModel)
  category!: AdvertCategoryModel
}
