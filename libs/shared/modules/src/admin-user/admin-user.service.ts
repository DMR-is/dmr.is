import { LogAndHandle, Transactional } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { AdminUser, AdminUserRole } from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'

import { Inject } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { adminUserMigrate } from './migrations/admin-user.migrate'
import { adminUserRoleMigrate } from './migrations/admin-user-role.migrate'
import { AdminUserModel } from './models/admin-user.model'
import { UserRoleModel } from './models/user-role.model'
import { IAdminUserService } from './admin-user.service.interface'

const LOGGING_CATEGORY = 'admin-user-service'

export class AdminUserService implements IAdminUserService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @InjectModel(AdminUserModel)
    private readonly adminUserModel: typeof AdminUserModel,
    @InjectModel(UserRoleModel)
    private readonly userRoleModel: typeof UserRoleModel,
  ) {}

  @LogAndHandle()
  @Transactional()
  async checkIfUserHasRole(
    userId: string,
    roleTitles: string[],
  ): Promise<ResultWrapper<{ hasRole: boolean }>> {
    const userLookup = await this.getUser(userId)

    if (!userLookup.result.ok) {
      this.logger.warn('Failed to get user', userLookup.result.error, {
        category: LOGGING_CATEGORY,
      })
      return ResultWrapper.err(userLookup.result.error)
    }

    const rolePromises = roleTitles.map((roleTitle) =>
      this.getRoleByTitle(roleTitle),
    )

    const roles = await Promise.all(rolePromises)

    const hasAccess = roles.some((role) => {
      let currentRole: AdminUserRole | null = null
      if (!role.result.ok) {
        this.logger.warn('Failed to get role', role.result.error, {
          error: role.result.error,
          category: LOGGING_CATEGORY,
        })
        return ResultWrapper.err(role.result.error)
      }

      if (!userLookup.result.ok) {
        return false
      }

      currentRole = role.result.value.role
      return userLookup.result.value.user.roles.some(
        (userRole) => userRole.id === currentRole.id,
      )
    })

    return ResultWrapper.ok({
      hasRole: hasAccess,
    })
  }

  @LogAndHandle()
  @Transactional()
  async getRoleByTitle(
    title: string,
  ): Promise<ResultWrapper<{ role: AdminUserRole }>> {
    const roleLookup = await this.userRoleModel.findOne({
      where: {
        title,
      },
    })

    if (!roleLookup) {
      this.logger.warn(`Role<${title}> not found`, {
        title: title,
        category: LOGGING_CATEGORY,
      })
      return ResultWrapper.err({
        code: 404,
        message: `Role<${title}> not found`,
      })
    }

    return ResultWrapper.ok({
      role: adminUserRoleMigrate(roleLookup),
    })
  }

  @LogAndHandle()
  @Transactional()
  async getRoles(): Promise<ResultWrapper<{ roles: AdminUserRole[] }>> {
    const roles = await this.userRoleModel.findAll()

    const migrated = roles.map((role) => adminUserRoleMigrate(role))

    return ResultWrapper.ok({
      roles: migrated,
    })
  }

  @LogAndHandle()
  @Transactional()
  async getUser(id: string): Promise<ResultWrapper<{ user: AdminUser }>> {
    const userLookup = await this.adminUserModel.findByPk(id)

    if (!userLookup) {
      this.logger.warn(`User<${id}> not found`, {
        id: id,
        category: LOGGING_CATEGORY,
      })
      return ResultWrapper.err({
        code: 404,
        message: `User<${id}> not found`,
      })
    }

    return ResultWrapper.ok({
      user: adminUserMigrate(userLookup),
    })
  }
}
