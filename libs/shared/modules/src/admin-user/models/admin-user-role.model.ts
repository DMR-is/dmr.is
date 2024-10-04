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
import { UserRoleModel } from './user-role.model'

@Table({ tableName: 'application_user_involved_party', timestamps: false })
export class AdminUserRoleModel extends Model {
  @PrimaryKey
  @ForeignKey(() => AdminUserModel)
  @Column({
    type: DataType.UUIDV4,
    allowNull: false,
    field: 'admin_user_id',
  })
  adminUserId!: string

  @PrimaryKey
  @ForeignKey(() => UserRoleModel)
  @Column({
    type: DataType.UUIDV4,
    allowNull: false,
    field: 'user_role_id',
  })
  roleId!: string

  @BelongsTo(() => AdminUserModel)
  adminUser!: AdminUserModel

  @BelongsTo(() => UserRoleModel)
  role!: UserRoleModel
}
