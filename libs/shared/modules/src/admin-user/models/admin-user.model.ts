import {
  BelongsToMany,
  Column,
  DataType,
  Model,
  Table,
} from 'sequelize-typescript'

import { AdminUserRolesModel } from './admin-user-roles.model'
import { UserRoleModel } from './user-role.model'

@Table({ tableName: 'admin_user', timestamps: false })
export class AdminUserModel extends Model {
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
    field: 'national_id',
  })
  nationalId!: string

  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: 'first_name',
  })
  firstName!: string

  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: 'last_name',
  })
  lastName!: string

  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: 'last_name',
  })
  displayName!: string

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  created!: string

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  updated!: string

  @BelongsToMany(() => UserRoleModel, {
    through: () => AdminUserRolesModel,
  })
  roles!: UserRoleModel[]
}
