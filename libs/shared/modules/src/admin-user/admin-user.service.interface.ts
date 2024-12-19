import {
  AdminUserRole,
  CreateAdminUser,
  GetAdminUser,
  GetAdminUsers,
  UpdateAdminUser,
} from '@dmr.is/shared/dto'
import { AdminUserRoleTitle, ResultWrapper } from '@dmr.is/types'

export interface IAdminUserService {
  getUserById(id: string): Promise<ResultWrapper<GetAdminUser>>
  getUserByNationalId(nationalId: string): Promise<ResultWrapper<GetAdminUser>>

  getRoles(): Promise<ResultWrapper<{ roles: AdminUserRole[] }>>

  getRoleByTitle(title: string): Promise<ResultWrapper<{ role: AdminUserRole }>>

  checkIfUserHasRole(
    nationalId: string,
    roleTitles: AdminUserRoleTitle[],
  ): Promise<ResultWrapper<{ hasRole: boolean }>>

  createAdminUser(body: CreateAdminUser): Promise<ResultWrapper>

  getUsers(): Promise<ResultWrapper<GetAdminUsers>>

  updateUser(id: string, body: UpdateAdminUser): Promise<ResultWrapper>

  deleteUser(id: string): Promise<ResultWrapper>
}

export const IAdminUserService = Symbol('IAdminUserService')
