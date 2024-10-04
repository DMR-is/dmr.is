import { Sequelize } from 'sequelize-typescript'
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
    private sequelize: Sequelize,
  ) {}

  @LogAndHandle({ logArgs: false })
  @Transactional()
  async checkIfUserHasRole(
    nationalId: string,
    roleTitles: string[],
  ): Promise<ResultWrapper<{ hasRole: boolean }>> {
    const userLookup = await this.getUserByNationalId(nationalId)
    if (!userLookup.result.ok) {
      this.logger.warn('Could not find user by nationalId', {
        error: userLookup.result.error,
        method: 'checkIfUserHasRole',
        category: LOGGING_CATEGORY,
      })
      return ResultWrapper.err(userLookup.result.error)
    }

    const user = userLookup.result.value.user

    const rolePromises = roleTitles.map((roleTitle) =>
      this.getRoleByTitle(roleTitle),
    )

    const roles = await Promise.all(rolePromises)

    const hasAccess = roles.some((role) => {
      if (!role.result.ok) {
        this.logger.warn('Could not get user roles', {
          error: role.result.error,
          method: 'checkIfUserHasRole',
          category: LOGGING_CATEGORY,
        })
        return ResultWrapper.err({
          code: 500,
          message: 'Could not get user roles',
        })
      }

      const currentRole = role.result.value.role
      return user.roles.some((userRole) => userRole.id === currentRole.id)
    })

    return ResultWrapper.ok({
      hasRole: hasAccess,
    })
  }

  @LogAndHandle({ logArgs: false })
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
        method: 'getRoleByTitle',
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

  @LogAndHandle({ logArgs: false })
  @Transactional()
  async getRoles(): Promise<ResultWrapper<{ roles: AdminUserRole[] }>> {
    const roles = await this.userRoleModel.findAll()

    const migrated = roles.map((role) => adminUserRoleMigrate(role))

    return ResultWrapper.ok({
      roles: migrated,
    })
  }

  @LogAndHandle({ logArgs: false })
  @Transactional()
  async getUserById(id: string): Promise<ResultWrapper<{ user: AdminUser }>> {
    const userLookup = await this.adminUserModel.findByPk(id)

    if (!userLookup) {
      this.logger.warn(`User not found`, {
        id: id,
        method: 'getUserById',
        category: LOGGING_CATEGORY,
      })
      return ResultWrapper.err({
        code: 404,
        message: `User not found`,
      })
    }

    return ResultWrapper.ok({
      user: adminUserMigrate(userLookup),
    })
  }

  @LogAndHandle({ logArgs: false })
  @Transactional()
  async getUserByNationalId(
    nationalId: string,
  ): Promise<ResultWrapper<{ user: AdminUser }>> {
    const userLookup = await this.adminUserModel.findOne({
      where: {
        nationalId: nationalId,
      },
    })

    if (!userLookup) {
      this.logger.warn(`User not found`, {
        method: 'getUserByNationalId',
        category: LOGGING_CATEGORY,
      })
      return ResultWrapper.err({
        code: 404,
        message: `User not found`,
      })
    }

    return ResultWrapper.ok({
      user: adminUserMigrate(userLookup),
    })
  }
}
