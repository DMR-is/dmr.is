import {
  Column,
  DataType,
  HasOne,
  Model,
  NotNull,
  PrimaryKey,
  Table,
} from 'sequelize-typescript'

import { AdvertDTO } from './Advert'
import { AdvertCategoryDTO } from './AdvertCategory'

@Table({ tableName: 'advert_categories', timestamps: false })
export class AdvertCategoriesDTO extends Model {
  @PrimaryKey
  @Column({
    type: DataType.UUIDV4,
    allowNull: false,
  })
  advert_id!: string

  @PrimaryKey
  @Column({
    type: DataType.UUIDV4,
    allowNull: false,
  })
  category_id!: string

  @HasOne(() => AdvertDTO, 'id')
  advert?: AdvertDTO

  @HasOne(() => AdvertCategoryDTO, 'id')
  category?: AdvertCategoryDTO
}
