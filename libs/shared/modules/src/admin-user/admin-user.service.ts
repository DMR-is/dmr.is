import { Op } from 'sequelize'
import { Sequelize } from 'sequelize-typescript'
import { v4 as uuid } from 'uuid'
import { LogAndHandle, Transactional } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import {
  AdminUserRole,
  CreateAdminUser,
  GetAdminUser,
  GetAdminUsers,
  UpdateAdminUser,
} from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'

import { Inject } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { adminUserMigrate } from './migrations/admin-user.migrate'
import { adminUserRoleMigrate } from './migrations/admin-user-role.migrate'
import { AdminUserModel } from './models/admin-user.model'
import { AdminUserRolesModel } from './models/admin-user-roles.model'
import { AdminUserRoleModel } from './models/user-role.model'
import { IAdminUserService } from './admin-user.service.interface'

const LOGGING_CATEGORY = 'admin-user-service'

export class AdminUserService implements IAdminUserService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @InjectModel(AdminUserModel)
    private readonly adminUserModel: typeof AdminUserModel,
    @InjectModel(AdminUserRoleModel)
    private readonly adminUserRoleModel: typeof AdminUserRoleModel,

    @InjectModel(AdminUserRolesModel)
    private readonly adminUserRolesModel: typeof AdminUserRolesModel,
    private sequelize: Sequelize,
  ) {}

  @LogAndHandle({ logArgs: false })
  @Transactional()
  async checkIfUserHasRole(
    nationalId: string,
    roleTitles: string[],
  ): Promise<ResultWrapper<{ hasRole: boolean }>> {
    const user = await this.adminUserModel.findOne({
      where: {
        nationalId: nationalId,
      },
      include: [
        {
          model: AdminUserRoleModel,
          where: {
            title: {
              [Op.in]: roleTitles,
            },
          },
        },
      ],
    })

    if (!user) {
      return ResultWrapper.ok({
        hasRole: false,
      })
    }

    return ResultWrapper.ok({
      hasRole: true,
    })
  }

  @LogAndHandle({ logArgs: false })
  @Transactional()
  async getRoleByTitle(
    title: string,
  ): Promise<ResultWrapper<{ role: AdminUserRole }>> {
    const roleLookup = await this.adminUserRoleModel.findOne({
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
    const roles = await this.adminUserRoleModel.findAll()

    const migrated = roles.map((role) => adminUserRoleMigrate(role))

    return ResultWrapper.ok({
      roles: migrated,
    })
  }

  @LogAndHandle({ logArgs: false })
  @Transactional()
  async getUserById(id: string): Promise<ResultWrapper<GetAdminUser>> {
    const userLookup = await this.adminUserModel.findByPk(id, {
      include: [
        {
          model: AdminUserRoleModel,
        },
      ],
    })

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
  ): Promise<ResultWrapper<GetAdminUser>> {
    const userLookup = await this.adminUserModel.findOne({
      include: [
        {
          model: AdminUserRoleModel,
        },
      ],
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

  async createAdminUser(body: CreateAdminUser): Promise<ResultWrapper> {
    const transaction = await this.sequelize.transaction()
    try {
      const now = new Date().toISOString()
      const userId = uuid()
      await this.adminUserModel.create(
        {
          id: userId,
          nationalId: body.nationalId,
          email: body.email,
          displayName: body.displayName,
          firstName: body.firstName,
          lastName: body.lastName,
          created: now,
          updated: now,
        },
        {
          transaction: transaction,
        },
      )

      await this.adminUserRolesModel.bulkCreate(
        body.roleIds.map((roleId) => ({
          adminUserId: userId,
          roleId: roleId,
        })),
        {
          transaction: transaction,
        },
      )

      await transaction.commit()

      return ResultWrapper.ok()
    } catch (error) {
      await transaction.rollback()
      return ResultWrapper.err({
        code: 500,
        message: 'Could not create user',
      })
    }
  }

  @LogAndHandle()
  async getUsers(): Promise<ResultWrapper<GetAdminUsers>> {
    const users = await this.adminUserModel.findAll({
      include: [
        {
          model: AdminUserRoleModel,
        },
      ],
    })

    const mapped = users.map((user) => adminUserMigrate(user))

    return ResultWrapper.ok({
      users: mapped,
    })
  }

  async updateUser(id: string, body: UpdateAdminUser): Promise<ResultWrapper> {
    const user = await this.adminUserModel.findByPk(id)

    if (!user) {
      this.logger.warn(`User not found`, {
        id: id,
        method: 'updateUser',
        category: LOGGING_CATEGORY,
      })

      return ResultWrapper.err({
        code: 404,
        message: `User not found`,
      })
    }

    await user.update(body)

    return ResultWrapper.ok()
  }
  async deleteUser(id: string): Promise<ResultWrapper> {
    const transaction = await this.sequelize.transaction()
    try {
      const user = await this.adminUserModel.findByPk(id, { transaction })

      if (!user) {
        this.logger.warn(`User not found`, {
          id: id,
          method: 'deleteUser',
          category: LOGGING_CATEGORY,
        })

        return ResultWrapper.err({
          code: 404,
          message: `User not found`,
        })
      }

      const userRoles = await this.adminUserRolesModel.findAll({
        where: {
          adminUserId: id,
        },
        transaction,
      })

      await Promise.all(
        userRoles.map((userRole) => userRole.destroy({ transaction })),
      )

      await user.destroy({
        // viljum við eyða notanda? Ættum við frekar að deleted = true?
        transaction,
      })

      await transaction.commit()
      return ResultWrapper.ok()
    } catch (error) {
      await transaction.rollback()
      return ResultWrapper.err({
        code: 500,
        message: 'Could not delete user',
      })
    }
  }
}
