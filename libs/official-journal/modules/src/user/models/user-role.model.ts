import {
  Column,
  DataType,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript'

import { UserRoleEnum } from '@dmr.is/constants'

@Table({ tableName: 'user_role', timestamps: false })
export class UserRoleModel extends Model {
  @PrimaryKey
  @Column({
    type: DataType.UUIDV4,
    allowNull: false,
  })
  override id!: string

  @Column({
    type: DataType.ENUM(...Object.values(UserRoleEnum)),
    allowNull: false,
  })
  title!: UserRoleEnum

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  slug!: string
}
