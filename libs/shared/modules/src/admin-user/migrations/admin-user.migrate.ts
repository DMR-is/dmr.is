import { AdminUser } from '@dmr.is/shared/dto'

import { AdminUserModel } from '../models/admin-user.model'
import { adminUserRoleMigrate } from './admin-user-role.migrate'

export const adminUserMigrate = (model: AdminUserModel): AdminUser => {
  return {
    nationalId: model.nationalId,
    firstName: model.firstName,
    lastName: model.lastName,
    fullName: `${model.firstName} ${model.lastName}`,
    displayName: model.displayName,
    email: model.email,
    roles: model.roles?.map((role) => adminUserRoleMigrate(role)) ?? [],
  }
}
