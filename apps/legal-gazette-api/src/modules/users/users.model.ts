import {
  BelongsToMany,
  Column,
  DataType,
  DefaultScope,
  ForeignKey,
  HasOne,
} from 'sequelize-typescript'

import {
  LEGAL_GAZETTE_DEFAULT_ROLE_ID,
  LegalGazetteModels,
} from '@dmr.is/legal-gazette/constants'
import { BaseModel, BaseTable } from '@dmr.is/shared/models/base'

import { InstitutionModel } from '../institution/institution.model'
import { UserDto } from './dto/user.dto'
import { UserInstitutionModel } from './user-institutions.model'
import { UserRoleModel } from './user-roles.model'

export type UserAttributes = {
  id: string
  nationalId: string
  firstName: string
  lastName: string
  email: string
  phone: string
  lastSubmissionDate?: Date | null
}

export type UserCreateAttributes = {
  id?: string
  nationalId: string
  firstName: string
  lastName: string
  email: string
  phone?: string | null
  roleId?: string
  lastSubmissionDate?: Date | null
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
  phone!: string | null

  @Column({
    type: DataType.DATE,
    allowNull: true,
    defaultValue: null,
    field: 'last_submission_date',
  })
  lastSubmissionDate!: Date | null

  @ForeignKey(() => UserRoleModel)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'user_role_id',
    defaultValue: LEGAL_GAZETTE_DEFAULT_ROLE_ID,
  })
  roleId!: string

  @HasOne(() => UserRoleModel, { foreignKey: 'id' })
  role!: UserRoleModel

  @BelongsToMany(() => InstitutionModel, () => UserInstitutionModel)
  institutions!: InstitutionModel[]

  static fromModel(model: UserModel): UserDto {
    return {
      id: model.id,
      nationalId: model.nationalId,
      name: `${model.firstName} ${model.lastName}`,
      email: model.email,
      phone: model.phone,
    }
  }

  fromModel() {
    return UserModel.fromModel(this)
  }
}
