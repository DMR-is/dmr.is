import {
  Column,
  DataType,
  DefaultScope,
  Model,
  Table,
} from 'sequelize-typescript'

@Table({ tableName: 'advert_attachments', timestamps: true })
@DefaultScope(() => ({
  attributes: {
    exclude: ['created', 'updated', 'modified'],
  },
}))
export class AdvertAttachmentsDTO extends Model {
  @Column({
    type: DataType.UUIDV4,
    primaryKey: true,
    allowNull: false,
    defaultValue: DataType.UUIDV4,
  })
  override id!: string

  @Column({ type: DataType.UUIDV4, allowNull: false })
  advertId!: string

  @Column({ allowNull: false })
  name!: string

  @Column({ allowNull: false })
  type!: string

  @Column({ allowNull: false })
  url!: string
}
