import {
  Column,
  DataType,
  DeletedAt,
  ForeignKey,
  HasOne,
  Model,
  Table,
  UpdatedAt,
} from 'sequelize-typescript'

import { UserRoleModel } from './user-role.model'

@Table({ tableName: 'ojoi_user', timestamps: true, paranoid: true })
export class UserModel extends Model {
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
    field: 'display_name',
  })
  displayName!: string

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  email!: string

  @ForeignKey(() => UserRoleModel)
  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: 'role_id',
  })
  roleId!: string

  @HasOne(() => UserRoleModel)
  role!: UserRoleModel

  @DeletedAt
  @Column({ field: 'deleted_at' })
  override deletedAt!: Date

  @Column({ field: 'created_at' })
  override createdAt!: Date

  @UpdatedAt
  @Column({ field: 'updated_at' })
  override updatedAt!: Date
}
