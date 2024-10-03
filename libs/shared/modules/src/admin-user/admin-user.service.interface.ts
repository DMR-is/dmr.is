import { AdminUser, AdminUserRole } from '@dmr.is/shared/dto'
import { AdminUserRoleTitle, ResultWrapper } from '@dmr.is/types'

export interface IAdminUserService {
  getUserById(id: string): Promise<ResultWrapper<{ user: AdminUser }>>
  getUserByNationalId(
    nationalId: string,
  ): Promise<ResultWrapper<{ user: AdminUser }>>

  getRoles(): Promise<ResultWrapper<{ roles: AdminUserRole[] }>>

  getRoleByTitle(title: string): Promise<ResultWrapper<{ role: AdminUserRole }>>

  checkIfUserHasRole(
    nationalId: string,
    roleTitles: AdminUserRoleTitle[],
  ): Promise<ResultWrapper<{ hasRole: boolean }>>
}

export const IAdminUserService = Symbol('IAdminUserService')
