import { Column, DataType, Model, NotNull, Table } from 'sequelize-typescript'

@Table({ tableName: 'advert_main_category', timestamps: false })
export class AdvertMainCategory extends Model {
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

  @Column
  description!: string
}
