import { AdminUserRole } from '@dmr.is/shared/dto'

import { UserRoleModel } from '../models/user-role.model'

export const adminUserRoleMigrate = (model: UserRoleModel): AdminUserRole => {
  return {
    id: model.id,
    title: model.title,
    slug: model.slug,
  }
}
