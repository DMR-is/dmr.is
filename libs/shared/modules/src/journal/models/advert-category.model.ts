import {
  BelongsTo,
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
import { AdvertMainCategoryModel } from './advert-main-category.model'

@Table({ tableName: 'advert_category', timestamps: false })
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

  @Column({ type: DataType.UUIDV4, field: 'main_category_id' })
  mainCategoryID!: string | null

  @CreatedAt
  created!: Date

  @UpdatedAt
  updated!: Date

  @BelongsTo(() => AdvertMainCategoryModel, 'main_category_id')
  mainCategory!: AdvertMainCategoryModel

  @BelongsToMany(() => AdvertModel, {
    through: () => AdvertCategoriesModel,
  })
  adverts!: AdvertModel[]
}
