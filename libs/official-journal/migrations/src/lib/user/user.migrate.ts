import { UserDto } from '@dmr.is/official-journal/dto/user/user.dto'
import { UserModel } from '@dmr.is/official-journal/models'

import { institutionMigrate } from '../institution/institution.migrate'
import { userRoleMigrate } from './user-role.migrate'

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
