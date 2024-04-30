import { Column, DataType, Model, NotNull, Table } from 'sequelize-typescript'

@Table({ tableName: 'advert_status', timestamps: false })
export class AdvertStatusDTO extends Model {
  @Column({
    type: DataType.UUIDV4,
    primaryKey: true,
    allowNull: false,
    defaultValue: DataType.UUIDV4,
  })
  override id!: string

  @Column({ allowNull: false })
  title!: string
}
