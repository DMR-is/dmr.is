import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  HasOne,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript'

import { AdvertDTO } from './Advert'
import { AdvertCategoryDTO } from './AdvertCategory'

@Table({ tableName: 'advert_categories', timestamps: false })
export class AdvertCategoriesDTO extends Model {
  @PrimaryKey
  @ForeignKey(() => AdvertDTO)
  @Column({
    type: DataType.UUIDV4,
    allowNull: false,
  })
  advert_id!: string

  @PrimaryKey
  @ForeignKey(() => AdvertCategoryDTO)
  @Column({
    type: DataType.UUIDV4,
    allowNull: false,
  })
  category_id!: string

  @BelongsTo(() => AdvertDTO)
  advert?: AdvertDTO

  @BelongsTo(() => AdvertCategoryDTO)
  category?: AdvertCategoryDTO
}
