import {
  Column,
  DataType,
  HasOne,
  Model,
  NotNull,
  PrimaryKey,
  Table,
} from 'sequelize-typescript'
import { Category } from '@dmr.is/shared/dto'

import { Advert } from './Advert'
import { AdvertCategory } from './AdvertCategory'

@Table({ tableName: 'advert_categories', timestamps: false })
export class AdvertCategories extends Model {
  @PrimaryKey
  @NotNull
  @Column({
    type: DataType.UUIDV4,
  })
  advert_id!: string

  @PrimaryKey
  @NotNull
  @Column({
    type: DataType.UUIDV4,
    allowNull: false,
  })
  category_id!: string

  @HasOne(() => Advert, 'id')
  advert?: Advert

  @HasOne(() => AdvertCategory, 'id')
  category?: Category
}
