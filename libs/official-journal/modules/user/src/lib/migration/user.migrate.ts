import { UserModel } from '../models/user.model'
import { UserRoleModel } from '../models/user-role.model'
import { UserRoleDto } from '../dto/user-role.dto'
import { UserDto } from '../dto/user.dto'
import { advertInvolvedPartyMigrate } from '@dmr.is/official-journal/modules/journal'

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
      advertInvolvedPartyMigrate(involvedParty),
    ),
    createdAt: model.createdAt.toISOString(),
    updatedAt: model.updatedAt.toISOString(),
    deletedAt: model.deletedAt ? model.deletedAt.toISOString() : null,
  }
}
