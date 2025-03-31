import { UserRoleModel, UserModel } from '@dmr.is/official-journal/models'
import { UserRoleDto } from '../dto/user-role.dto'
import { UserDto } from '../dto/user.dto'
import { institutionMigrate } from './institution.migrate'

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
    involvedParties: model.involvedParties.map((involvedParty) =>
      institutionMigrate(involvedParty),
    ),
    createdAt: model.createdAt.toISOString(),
    updatedAt: model.updatedAt.toISOString(),
    deletedAt: model.deletedAt ? model.deletedAt.toISOString() : null,
  }
}
