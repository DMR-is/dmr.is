import { Column, DataType, HasMany, Model, Table } from 'sequelize-typescript'

import { AdvertCategoryModel } from './advert-category.model'

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

  @HasMany(() => AdvertCategoryModel, 'mainCategoryID')
  categories!: AdvertCategoryModel[]
}
