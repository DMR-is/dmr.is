import { UserDto, UserRoleDto } from '@dmr.is/shared/dto'

import { UserModel } from '../models/user.model'
import { UserRoleModel } from '../models/user-role.model'

export const userRoleMigrate = (model: UserRoleModel): UserRoleDto => {
  return {
    id: model.id,
    title: model.title,
    slug: model.slug,
  }
}

export const userMigrate = (model: UserModel): UserDto => {
  return {
    id: model.id,
    nationalId: model.nationalId,
    firstName: model.firstName,
    lastName: model.lastName,
    fullName: `${model.firstName} ${model.lastName}`,
    displayName: model.displayName,
    email: model.email,
    role: userRoleMigrate(model.role),
    createdAt: model.createdAt,
    updatedAt: model.updatedAt,
    deletedAt: model.deletedAt,
  }
}
