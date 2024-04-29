import {
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  Model,
  NotNull,
  Table,
  UpdatedAt,
} from 'sequelize-typescript'

import { AdvertMainCategoryDTO } from './AdvertMainCategory'

@Table({ tableName: 'advert_category', timestamps: false })
export class AdvertCategoryDTO extends Model {
  @Column({
    type: DataType.UUIDV4,
    primaryKey: true,
    allowNull: false,
    defaultValue: DataType.UUIDV4,
  })
  override id!: string

  @Column
  @NotNull
  title!: string

  @Column
  @NotNull
  slug!: string

  @Column({ type: DataType.UUIDV4, field: 'main_category_id' })
  mainCategoryID!: string

  @CreatedAt
  created!: Date

  @UpdatedAt
  updated!: Date

  @BelongsTo(() => AdvertMainCategoryDTO, 'main_category_id')
  mainCategory!: AdvertMainCategoryDTO
}
