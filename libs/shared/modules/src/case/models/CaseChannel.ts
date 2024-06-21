import {
  Column,
  DataType,
  DefaultScope,
  Model,
  Table,
} from 'sequelize-typescript'

@Table({ tableName: 'case_channel', timestamps: false })
@DefaultScope(() => ({
  attributes: {
    exclude: ['created', 'updated'],
  },
}))
export class CaseChannelDto extends Model {
  @Column({
    type: DataType.UUIDV4,
    primaryKey: true,
    allowNull: false,
    defaultValue: DataType.UUIDV4,
  })
  override id!: string

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    field: 'email',
  })
  email!: string

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    field: 'phone',
  })
  phone!: string
}
