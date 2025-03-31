import { UserRoleModel } from '@dmr.is/official-journal/models'
import { UserRoleDto } from '../dto/user-role.dto'

export const userRoleMigrate = (model: UserRoleModel): UserRoleDto => {
  return {
    id: model.id,
    title: model.title,
    slug: model.slug,
  }
}
