import {
  BelongsToMany,
  Column,
  CreatedAt,
  DataType,
  Model,
  Table,
  UpdatedAt,
} from 'sequelize-typescript'

import { AdvertModel } from './advert.model'
import { AdvertCategoriesModel } from './advert-categories.model'
import { AdvertCategoryCategoriesModel } from './advert-category-categories.model'
import { AdvertMainCategoryModel } from './advert-main-category.model'
import { OfficialJournalModels } from '../constants'

@Table({ tableName: OfficialJournalModels.CATEGORY, timestamps: false })
export class AdvertCategoryModel extends Model {
  @Column({
    type: DataType.UUIDV4,
    primaryKey: true,
    allowNull: false,
    defaultValue: DataType.UUIDV4,
  })
  override id!: string

  @Column({ allowNull: false })
  title!: string

  @Column({ allowNull: false })
  slug!: string

  @CreatedAt
  created!: Date

  @UpdatedAt
  updated!: Date

  @BelongsToMany(() => AdvertMainCategoryModel, {
    through: () => AdvertCategoryCategoriesModel,
  })
  mainCategories!: AdvertMainCategoryModel[]

  @BelongsToMany(() => AdvertModel, {
    through: () => AdvertCategoriesModel,
  })
  adverts!: AdvertModel[]
}
