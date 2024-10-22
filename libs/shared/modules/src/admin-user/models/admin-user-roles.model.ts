import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript'

import { AdminUserModel } from './admin-user.model'
import { AdminUserRoleModel } from './user-role.model'

@Table({ tableName: 'admin_user_roles', timestamps: false })
export class AdminUserRolesModel extends Model {
  @PrimaryKey
  @ForeignKey(() => AdminUserModel)
  @Column({
    type: DataType.UUIDV4,
    allowNull: false,
    field: 'admin_user_id',
  })
  adminUserId!: string

  @PrimaryKey
  @ForeignKey(() => AdminUserRoleModel)
  @Column({
    type: DataType.UUIDV4,
    allowNull: false,
    field: 'user_role_id',
  })
  roleId!: string

  @BelongsTo(() => AdminUserModel)
  adminUser!: AdminUserModel

  @BelongsTo(() => AdminUserRoleModel)
  role!: AdminUserRoleModel
}
