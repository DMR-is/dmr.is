import { UserRoleDto } from '@dmr.is/official-journal/dto/user/user.dto'
import { UserRoleModel } from '@dmr.is/official-journal/models'

export const userRoleMigrate = (model: UserRoleModel): UserRoleDto => {
  return {
    id: model.id,
    title: model.title,
    slug: model.slug,
  }
}
