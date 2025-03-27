import {
  BelongsTo,
  BelongsToMany,
  Column,
  CreatedAt,
  DataType,
  DefaultScope,
  DeletedAt,
  ForeignKey,
  Index,
  Model,
  Table,
  UpdatedAt,
} from 'sequelize-typescript'

import { UserInvolvedPartiesModel } from './user-involved-parties.model'
import { UserRoleModel } from './user-role.model'
import { OfficialJournalModels } from '../constants'
import { AdvertInvolvedPartyModel } from '../journal/advert-involved-party.model'

@DefaultScope(() => ({
  include: [UserRoleModel, AdvertInvolvedPartyModel],
  order: [['created_at', 'DESC']],
}))
@Table({
  tableName: OfficialJournalModels.USER,
  timestamps: true,
  paranoid: true,
})
export class UserModel extends Model {
  @Column({
    type: DataType.UUIDV4,
    primaryKey: true,
    allowNull: false,
    defaultValue: DataType.UUIDV4,
  })
  override id!: string

  @Index({ name: 'idx_national_id', unique: true })
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

  @BelongsTo(() => UserRoleModel, { as: 'role' })
  role!: UserRoleModel

  @BelongsToMany(() => AdvertInvolvedPartyModel, {
    through: { model: () => UserInvolvedPartiesModel },
    as: 'involvedParties',
  })
  involvedParties!: AdvertInvolvedPartyModel[]

  @DeletedAt
  @Column({ field: 'deleted_at', allowNull: true, type: DataType.DATE })
  override deletedAt!: Date | null

  @CreatedAt
  @Column({ field: 'created_at' })
  override createdAt!: Date

  @UpdatedAt
  @Column({ field: 'updated_at' })
  override updatedAt!: Date
}
