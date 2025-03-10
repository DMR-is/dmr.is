import { Column, DataType, Model, PrimaryKey } from 'sequelize-typescript'
import { UserRole } from '@dmr.is/constants'

export class UserRoleModel extends Model {
  @PrimaryKey
  @Column({
    type: DataType.UUIDV4,
    allowNull: false,
  })
  override id!: string

  @Column({
    type: DataType.ENUM(...Object.values(UserRole)),
    allowNull: false,
  })
  title!: UserRole

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  slug!: string
}
