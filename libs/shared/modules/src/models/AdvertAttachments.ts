import {
  Column,
  DataType,
  DefaultScope,
  Model,
  NotNull,
  Table,
} from 'sequelize-typescript'

@Table({ tableName: 'advert_attachments', timestamps: true })
@DefaultScope(() => ({
  attributes: {
    exclude: ['created', 'updated'],
  },
}))
export class AdvertAttachments extends Model {
  @Column({
    type: DataType.UUIDV4,
    primaryKey: true,
    allowNull: false,
    defaultValue: DataType.UUIDV4,
  })
  override id!: string

  @Column({ type: DataType.UUIDV4, allowNull: false })
  advertId!: string

  @Column
  @NotNull
  name!: string

  @Column
  @NotNull
  type!: string

  @Column
  @NotNull
  url!: string
}
