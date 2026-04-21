import { Column, DataType } from 'sequelize-typescript'

import { MutableModel, MutableTable } from '@dmr.is/shared-models-base'

import { DoeModels } from '../../../core/constants'
import type { UserDto } from '../dto/user.dto'

type UserAttributes = {
  nationalId: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  isActive: boolean
}

type UserCreateAttributes = {
  nationalId: string
  firstName: string
  lastName: string
  email: string
  phone?: string | null
  isActive?: boolean
}

@MutableTable({ tableName: DoeModels.USER })
export class UserModel extends MutableModel<
  UserAttributes,
  UserCreateAttributes
> {
  @Column({ type: DataType.TEXT, allowNull: false, field: 'national_id' })
  nationalId!: string

  @Column({ type: DataType.TEXT, allowNull: false, field: 'first_name' })
  firstName!: string

  @Column({ type: DataType.TEXT, allowNull: false, field: 'last_name' })
  lastName!: string

  @Column({ type: DataType.TEXT, allowNull: false })
  email!: string

  @Column({ type: DataType.TEXT, allowNull: true })
  phone!: string | null

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'is_active',
  })
  isActive!: boolean

  static fromModel(model: UserModel): UserDto {
    return {
      id: model.id,
      nationalId: model.nationalId,
      firstName: model.firstName,
      lastName: model.lastName,
      email: model.email,
      phone: model.phone,
      isActive: model.isActive,
    }
  }

  fromModel(): UserDto {
    return UserModel.fromModel(this)
  }
}
