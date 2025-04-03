import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript'

import { AdvertModel } from './advert.model'
import { AdvertCategoryModel } from './advert-category.model'
import { OfficialJournalModels } from '../constants'

@Table({
  tableName: OfficialJournalModels.ADVERT_CATEGORIES,
  timestamps: false,
})
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
  advert?: AdvertModel

  @BelongsTo(() => AdvertCategoryModel)
  category?: AdvertCategoryModel
}
