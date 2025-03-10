import { UserRole } from '@dmr.is/constants'
import { UserDto } from '@dmr.is/shared/dto'

export const getRole = (user: UserDto): UserRole => {
  const hasAdminRole = user.roles.find((role) => role.title === UserRole.Admin)
  const hasEditorRole = user.roles.find(
    (role) => role.title === UserRole.Editor,
  )

  if (hasAdminRole) {
    return UserRole.Admin
  }

  if (hasEditorRole) {
    return UserRole.Editor
  }

  return UserRole.User
}
