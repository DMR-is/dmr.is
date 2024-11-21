import {
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  DefaultScope,
  Model,
  Table,
  UpdatedAt,
} from 'sequelize-typescript'

import { AdvertMainTypeModel } from './advert-main-type.model'

@Table({ tableName: 'advert_type', timestamps: true })
@DefaultScope(() => ({
  attributes: {
    exclude: ['created', 'updated'],
  },
}))
export class AdvertTypeModelNew extends Model {
  @Column({
    type: DataType.UUIDV4,
    primaryKey: true,
    allowNull: false,
    defaultValue: DataType.UUIDV4,
  })
  override id!: string

  @Column
  title!: string

  @Column
  slug!: string

  @BelongsTo(() => AdvertMainTypeModel, 'main_type_id')
  mainType!: AdvertMainTypeModel

  @CreatedAt
  created!: Date

  @UpdatedAt
  updated!: Date
}
