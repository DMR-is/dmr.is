// Association annotations use a type-only alias - see `src/models.md`.
import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript'

import type { AdvertModel as AdvertModelRef } from './advert.model'
import { AdvertModel } from './advert.model'
import type { AdvertCategoryModel as AdvertCategoryModelRef } from './advert-category.model'
import { AdvertCategoryModel } from './advert-category.model'

@Table({ tableName: 'advert_categories', timestamps: false })
export class AdvertCategoriesModel extends Model {
  @PrimaryKey
  @ForeignKey(() => AdvertModel)
  @Column({
    type: DataType.UUIDV4,
    allowNull: false,
  })
  advert_id!: string

  @PrimaryKey
  @ForeignKey(() => AdvertCategoryModel)
  @Column({
    type: DataType.UUIDV4,
    allowNull: false,
  })
  category_id!: string

  @BelongsTo(() => AdvertModel)
  advert?: AdvertModelRef

  @BelongsTo(() => AdvertCategoryModel)
  category?: AdvertCategoryModelRef
}
