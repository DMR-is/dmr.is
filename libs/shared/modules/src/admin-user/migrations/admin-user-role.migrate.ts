import { AdminUserRole } from '@dmr.is/shared/dto'

import { AdminUserRoleModel } from '../models/user-role.model'

export const adminUserRoleMigrate = (
  model: AdminUserRoleModel,
): AdminUserRole => {
  return {
    id: model.id,
    title: model.title,
    slug: model.slug,
  }
}
