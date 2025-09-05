import { Column, DataType, DefaultScope } from 'sequelize-typescript'

import { BaseModel, BaseTable } from '@dmr.is/shared/models/base'

import { LegalGazetteModels } from '../../lib/constants'
import { UserDto } from './dto/user.dto'

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

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`
  }

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
