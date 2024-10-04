import { Column, DataType, Model, Table } from 'sequelize-typescript'

@Table({ tableName: 'user_role', timestamps: false })
export class UserRoleModel extends Model {
  @Column({
    type: DataType.UUIDV4,
    primaryKey: true,
    allowNull: false,
    defaultValue: DataType.UUIDV4,
  })
  override id!: string

  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: 'title',
  })
  title!: string

  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: 'slug',
  })
  slug!: string
}
