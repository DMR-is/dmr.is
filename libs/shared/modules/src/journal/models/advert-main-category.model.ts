import {
  BelongsToMany,
  Column,
  DataType,
  Model,
  Table,
} from 'sequelize-typescript'

import { AdvertCategoryModel } from './advert-category.model'
import { AdvertCategoryCategoriesModel } from './advert-category-categories.model'

@Table({ tableName: 'advert_main_category', timestamps: false })
export class AdvertMainCategoryModel extends Model {
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

  @Column
  description!: string

  @BelongsToMany(() => AdvertCategoryModel, {
    through: { model: () => AdvertCategoryCategoriesModel },
  })
  categories?: AdvertCategoryModel[]
}
