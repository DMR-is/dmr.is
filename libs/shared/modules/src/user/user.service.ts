import { Cache } from 'cache-manager'
import { Op, Transaction } from 'sequelize'
import { Sequelize } from 'sequelize-typescript'

import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { Inject, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { UserRoleEnum } from '@dmr.is/constants'
import { CacheEvict, LogAndHandle, Transactional } from '@dmr.is/decorators'
import { Cacheable } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import {
  CreateUserDto,
  GetInvoledPartiesByUserResponse,
  GetMyUserInfoResponse,
  GetRolesByUserResponse,
  GetUserResponse,
  GetUsersQuery,
  GetUsersResponse,
  UpdateUserDto,
  UserDto,
} from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'
import { generatePaging, getLimitAndOffset } from '@dmr.is/utils'

import { advertInvolvedPartyMigrate } from '../journal/migrations'
import { AdvertInvolvedPartyModel } from '../journal/models'
import {
  getMyUserInfoMigrate,
  userMigrate,
  userRoleMigrate,
} from './migration/user.migrate'
import { UserModel } from './models/user.model'
import { UserInvolvedPartiesModel } from './models/user-involved-parties.model'
import { UserRoleModel } from './models/user-role.model'
import { IUserService } from './user.service.interface'
const LOGGING_CONTEXT = 'UserService'
const LOGGING_CATEGORY = 'user-service'

@Injectable()
export class UserService implements IUserService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    // This is needed to be able to use the Cacheable and CacheEvict decorators
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache | undefined,
    @InjectModel(UserModel) private readonly userModel: typeof UserModel,
    @InjectModel(UserRoleModel)
    private readonly userRoleModel: typeof UserRoleModel,
    @InjectModel(AdvertInvolvedPartyModel)
    private readonly advertInvolvedPartyModel: typeof AdvertInvolvedPartyModel,
    @InjectModel(UserInvolvedPartiesModel)
    private readonly userInvolvedPartiesModel: typeof UserInvolvedPartiesModel,
    private readonly sequelize: Sequelize,
  ) {}

  @LogAndHandle()
  @Transactional()
  async createUser(
    body: CreateUserDto,
    currentUser: UserDto,
    transaction?: Transaction,
  ): Promise<ResultWrapper<GetUserResponse>> {
    const isAdmin = currentUser.role.title === UserRoleEnum.Admin
    const involedPartyIds: string[] = isAdmin
      ? (body.involvedParties ?? [])
      : currentUser.involvedParties.map((involvedParty) => involvedParty.id)

    if (!isAdmin) {
      const role = await this.userRoleModel.findByPk(body.roleId, {
        transaction,
      })

      const hasPermission = role?.title !== UserRoleEnum.User
      const hasAnyInvolvedParties = involedPartyIds.length > 0
      const hasInvolvedParties = currentUser.involvedParties.every(
        (involvedParty) => involedPartyIds.includes(involvedParty.id),
      )

      if (!hasPermission) {
        this.logger.warn(
          `User without a sufficent role tried to create a user`,
          {
            context: LOGGING_CONTEXT,
            category: LOGGING_CATEGORY,
            userId: currentUser.id,
          },
        )
      }

      if (!hasAnyInvolvedParties) {
        this.logger.warn(
          'User without any involved parties tried to create a user',
          {
            context: LOGGING_CONTEXT,
            category: LOGGING_CATEGORY,
            userId: currentUser.id,
          },
        )
      }

      if (!hasInvolvedParties) {
        this.logger.warn(
          'User tried to create a user with different involved parties',
          {
            context: LOGGING_CONTEXT,
            category: LOGGING_CATEGORY,
            userId: currentUser.id,
          },
        )
      }

      if (!hasPermission || !hasAnyInvolvedParties || !hasInvolvedParties) {
        return ResultWrapper.err({
          code: 403,
          message: 'Forbidden',
        })
      }
    }

    const userRole = await this.userRoleModel.findOne({
      where: {
        title: UserRoleEnum.User,
      },
    })

    if (!userRole) {
      this.logger.warn('User role not found', {
        context: LOGGING_CONTEXT,
        category: LOGGING_CATEGORY,
      })
      return ResultWrapper.err({
        code: 500,
        message: 'Could not create user',
      })
    }

    const roleId = isAdmin ? body.roleId : userRole.id

    const newUser = await this.userModel.create(
      {
        nationalId: body.nationalId,
        firstName: body.firstName,
        lastName: body.lastName,
        displayName: body.displayName
          ? body.displayName
          : `${body.firstName} ${body.lastName}`,
        email: body.email,
        roleId: roleId,
      },
      {
        returning: ['id'],
        transaction,
      },
    )

    const userInvolvedParties = involedPartyIds.map((involvedPartyId) => ({
      userId: newUser.id,
      involvedPartyId,
    }))

    await this.userInvolvedPartiesModel.bulkCreate(userInvolvedParties, {
      transaction,
    })

    const withAssociations = await this.userModel.findByPk(newUser.id, {
      transaction,
    })

    if (!withAssociations) {
      this.logger.warn('User not found after creation', {
        context: LOGGING_CONTEXT,
        category: LOGGING_CATEGORY,
        newUserId: newUser.id,
      })
      return ResultWrapper.err({
        code: 500,
        message: 'Could not create user',
      })
    }

    const migrated = userMigrate(withAssociations)

    return ResultWrapper.ok({ user: migrated })
  }

  @LogAndHandle()
  @Transactional()
  @CacheEvict(0)
  async updateUser(
    userId: string,
    body: UpdateUserDto,
    currentUser: UserDto,
    transaction?: Transaction,
  ): Promise<ResultWrapper<GetUserResponse>> {
    const isAdmin = currentUser.role.title === UserRoleEnum.Admin

    const userToUpdate = await this.userModel.findByPk(userId, { transaction })

    if (!userToUpdate) {
      return ResultWrapper.err({
        code: 404,
        message: 'User not found',
      })
    }

    if (!isAdmin) {
      const hasUpdatePermission = userToUpdate.role.title !== UserRoleEnum.User
      const hasInvoledParty = userToUpdate.involvedParties.every(
        (involvedParty) =>
          currentUser.involvedParties.find(
            (userInvolvedParty) => userInvolvedParty.id === involvedParty.id,
          ),
      )

      if (!hasUpdatePermission || !hasInvoledParty) {
        if (!hasUpdatePermission) {
          this.logger.warn(
            `User without sufficent role tried to update a user`,
            {
              context: LOGGING_CONTEXT,
              category: LOGGING_CATEGORY,
              userId: currentUser.id,
            },
          )
        }

        if (!hasInvoledParty) {
          this.logger.warn(
            `User without any involved parties tried to update a user`,
            {
              context: LOGGING_CONTEXT,
              category: LOGGING_CATEGORY,
              userId: currentUser.id,
            },
          )
        }

        return ResultWrapper.err({
          code: 403,
          message: 'Forbidden',
        })
      }
    }

    await userToUpdate.update(
      {
        firstName: body.firstName,
        lastName: body.lastName,
        displayName: body.displayName,
        email: body.email,
        roleId: body.roleId,
      },
      { transaction },
    )

    if (body.involvedParties) {
      await this.userInvolvedPartiesModel.destroy({
        where: {
          userId,
        },
        transaction,
      })

      const userInvolvedParties = body.involvedParties.map(
        (involvedPartyId) => ({
          userId,
          involvedPartyId,
        }),
      )

      await this.userInvolvedPartiesModel.bulkCreate(userInvolvedParties, {
        transaction,
      })
    }

    const withAssociations = await this.userModel.findByPk(userId, {
      transaction,
    })

    if (!withAssociations) {
      this.logger.warn('User not found after update', {
        context: LOGGING_CONTEXT,
        category: LOGGING_CATEGORY,
        userId,
      })
      return ResultWrapper.err({
        code: 500,
        message: 'Could not update user',
      })
    }

    const migrated = userMigrate(withAssociations)

    return ResultWrapper.ok({ user: migrated })
  }

  @LogAndHandle()
  @Transactional()
  async deleteUser(
    userId: string,
    currentUser: UserDto,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    const isAdmin = currentUser.role.title === UserRoleEnum.Admin
    const userToDelete = await this.userModel.findByPk(userId, {
      transaction,
    })

    if (!userToDelete) {
      return ResultWrapper.err({
        code: 404,
        message: 'User not found',
      })
    }

    if (!isAdmin) {
      const hasDeletePermission = userToDelete?.role.title !== UserRoleEnum.User
      const hasInvoledParty = userToDelete?.involvedParties.some(
        (involvedParty) =>
          currentUser.involvedParties.find(
            (userInvolvedParty) => userInvolvedParty.id === involvedParty.id,
          ),
      )

      if (!hasDeletePermission || !hasInvoledParty) {
        if (!hasDeletePermission) {
          this.logger.warn(
            `User without sufficent role tried to delete a user`,
            {
              context: LOGGING_CONTEXT,
              category: LOGGING_CATEGORY,
              userId: currentUser.id,
              userToBeDeletedId: userId,
            },
          )
        }

        if (!hasInvoledParty) {
          this.logger.warn(
            `User without sufficent involved parties tried to delete a user`,
            {
              context: LOGGING_CONTEXT,
              category: LOGGING_CATEGORY,
              userId: currentUser.id,
            },
          )
        }

        return ResultWrapper.err({
          code: 403,
          message: 'Forbidden',
        })
      }
    }

    await this.userModel.destroy({
      where: {
        id: userId,
      },
      transaction,
    })

    return ResultWrapper.ok()
  }

  @LogAndHandle()
  async getInvolvedPartiesByUser(
    currentUser: UserDto,
  ): Promise<ResultWrapper<GetInvoledPartiesByUserResponse>> {
    const isAdmin = currentUser.role.title === UserRoleEnum.Admin

    let results: AdvertInvolvedPartyModel[]

    if (isAdmin) {
      results = await this.advertInvolvedPartyModel.findAll({
        attributes: ['id', 'title', 'slug'],
      })
    } else {
      const userInvolvedParties = await this.userInvolvedPartiesModel.findAll({
        include: [AdvertInvolvedPartyModel],
        where: {
          userId: currentUser.id,
        },
      })

      results = userInvolvedParties.map(
        (userInvolvedParty) => userInvolvedParty.involvedParties,
      )
    }

    const migrated = results.map((involvedParty) =>
      advertInvolvedPartyMigrate(involvedParty),
    )

    return ResultWrapper.ok({
      involvedParties: migrated,
    })
  }

  @LogAndHandle()
  async getMyUserInfo(
    currentUser: UserDto,
  ): Promise<ResultWrapper<GetMyUserInfoResponse>> {
    const user = await this.userModel.findByPk(currentUser.id, {
      attributes: ['firstName', 'lastName', 'email'],
    })

    if (!user) {
      return ResultWrapper.err({
        code: 404,
        message: 'User not found',
      })
    }

    const migrated = getMyUserInfoMigrate(user)

    return ResultWrapper.ok(migrated)
  }

  @LogAndHandle()
  async getRolesByUser(
    currentUser: UserDto,
  ): Promise<ResultWrapper<GetRolesByUserResponse>> {
    const isAdmin = currentUser.role.title === UserRoleEnum.Admin

    const roles = await this.userRoleModel.findAll({
      where: {
        title: {
          [Op.in]: isAdmin
            ? [UserRoleEnum.Admin, UserRoleEnum.Editor, UserRoleEnum.User]
            : [UserRoleEnum.Editor, UserRoleEnum.User],
        },
      },
    })

    const migrated = roles.map((role) => userRoleMigrate(role))

    return ResultWrapper.ok({ roles: migrated })
  }

  @LogAndHandle()
  async getUsersByUserInvolvedParties(
    query: GetUsersQuery,
    currentUser: UserDto,
  ): Promise<ResultWrapper<GetUsersResponse>> {
    const involedPartyIds = currentUser.involvedParties.map(
      (involvedParty) => involvedParty.id,
    )

    const { limit, offset } = getLimitAndOffset({
      page: query.page,
      pageSize: query.pageSize,
    })

    const users = await this.userModel.findAndCountAll({
      limit,
      offset,
      where: query.search
        ? {
            [Op.or]: {
              displayName: {
                [Op.iLike]: `%${query.search}%`,
              },
              email: {
                [Op.iLike]: `%${query.search}%`,
              },
              firstName: {
                [Op.iLike]: `%${query.search}%`,
              },
              lastName: {
                [Op.iLike]: `%${query.search}%`,
              },
            },
          }
        : {},
      include: [
        {
          model: AdvertInvolvedPartyModel,
          required: true,
          where: {
            id: {
              [Op.in]: involedPartyIds,
            },
          },
        },
        {
          model: UserRoleModel,
          where: query.role
            ? {
                [Op.and]: {
                  slug: {
                    [Op.eq]: query.role,
                  },
                  title: {
                    [Op.ne]: UserRoleEnum.Admin,
                  },
                },
              }
            : {},
        },
      ],
    })

    const migrated = users.rows.map((user) => userMigrate(user))
    const paging = generatePaging(
      users.rows,
      query.page,
      query.pageSize,
      users.count,
    )

    return ResultWrapper.ok({
      users: migrated,
      paging: paging,
    })
  }

  /**
   * ## ☢️ Should only be used by role guard! ☢️
   * @returns
   */
  @LogAndHandle()
  @Cacheable()
  async getUserByNationalId(
    nationalId: string,
  ): Promise<ResultWrapper<GetUserResponse>> {
    const found = await this.userModel.findOne({
      where: {
        nationalId,
      },
    })

    if (!found) {
      return ResultWrapper.err({
        code: 404,
        message: 'User not found',
      })
    }

    const migrated = userMigrate(found)

    return ResultWrapper.ok({
      user: migrated,
    })
  }

  @LogAndHandle()
  async getUsers(
    query: GetUsersQuery,
    currentUser: UserDto,
  ): Promise<ResultWrapper<GetUsersResponse>> {
    const isAdmin = currentUser.role.title === UserRoleEnum.Admin

    if (!isAdmin) {
      return this.getUsersByUserInvolvedParties(query, currentUser)
    }

    const whereParams = {}
    let hasInvolvedPartyFilter = false

    if (query.involvedParty?.length) {
      hasInvolvedPartyFilter = true
      Object.assign(whereParams, {
        slug: {
          [Op.eq]: query.involvedParty,
        },
      })
    }

    const { limit, offset } = getLimitAndOffset({
      page: query.page,
      pageSize: query.pageSize,
    })

    const users = await this.userModel.findAndCountAll({
      limit,
      offset,
      where: query.search
        ? {
            [Op.or]: {
              displayName: {
                [Op.iLike]: `%${query.search}%`,
              },
              email: {
                [Op.iLike]: `%${query.search}%`,
              },
              firstName: {
                [Op.iLike]: `%${query.search}%`,
              },
              lastName: {
                [Op.iLike]: `%${query.search}%`,
              },
            },
          }
        : {},
      include: [
        {
          required: hasInvolvedPartyFilter,
          model: AdvertInvolvedPartyModel,
          where: whereParams,
        },
        {
          model: UserRoleModel,
          where: query.role ? { slug: { [Op.eq]: query.role } } : {},
        },
      ],
    })

    const migrated = users.rows.map((user) => userMigrate(user))
    const paging = generatePaging(
      users.rows,
      query.page,
      query.pageSize,
      users.count,
    )

    return ResultWrapper.ok({
      users: migrated,
      paging: paging,
    })
  }
}
