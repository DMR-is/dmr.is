import {
  BelongsToMany,
  Column,
  DataType,
  DefaultScope,
  ForeignKey,
  HasOne,
} from 'sequelize-typescript'

import { LegalGazetteModels } from '@dmr.is/legal-gazette/constants'
import { BaseModel, BaseTable } from '@dmr.is/shared/models/base'

import { InstitutionModel } from '../institution/institution.model'
import { UserInstitutionModel } from './user-institutions.model'
import { UserRoleModel } from './user-roles.model'

export type UserAttributes = {
  id: string
  nationalId: string
  firstName: string
  lastName: string
  email: string
  phone: string
}

export type UserCreateAttributes = {
  id?: string
  nationalId: string
  firstName: string
  lastName: string
  email: string
  phone?: string | null
  roleId: string
}

@BaseTable({ tableName: LegalGazetteModels.USERS })
@DefaultScope(() => ({
  attributes: ['id', 'nationalId', 'firstName', 'lastName', 'email', 'phone'],
  orderBy: [
    ['firstName', 'ASC'],
    ['lastName', 'ASC'],
  ],
}))
export class UserModel extends BaseModel<UserAttributes, UserCreateAttributes> {
  @Column({
    type: DataType.TEXT,
    field: 'national_id',
    allowNull: false,
    unique: true,
  })
  nationalId!: string

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  firstName!: string

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  lastName!: string

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    unique: true,
  })
  email!: string

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    defaultValue: null,
  })
  phone!: string

  @ForeignKey(() => UserRoleModel)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'user_role_id',
  })
  roleId!: string

  @HasOne(() => UserRoleModel, { foreignKey: 'id' })
  role!: UserRoleModel

  @BelongsToMany(() => InstitutionModel, () => UserInstitutionModel)
  institutions!: InstitutionModel[]
}
