import { logger } from '@dmr.is/logging'
import { AdminUser } from '@dmr.is/shared/dto'

import { AdminUserModel } from '../models/admin-user.model'
import { adminUserRoleMigrate } from './admin-user-role.migrate'

export const adminUserMigrate = (model: AdminUserModel): AdminUser => {
  return {
    nationalId: model.nationalId,
    displayName: model.displayName,
    roles: model.roles?.map((role) => adminUserRoleMigrate(role)) ?? [],
  }
}
