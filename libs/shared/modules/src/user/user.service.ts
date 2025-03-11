import { Op } from 'sequelize'
import { UserRoleEnum } from '@dmr.is/constants'
import { LogAndHandle } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import {
  GetInvoledPartiesByUserResponse,
  GetRolesByUserResponse,
  GetUserResponse,
  GetUsersQuery,
  GetUsersResponse,
  UserDto,
} from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'
import { generatePaging, getLimitAndOffset } from '@dmr.is/utils'

import { Inject, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { advertInvolvedPartyMigrate } from '../journal/migrations'
import { AdvertInvolvedPartyModel } from '../journal/models'
import { userMigrate, userRoleMigrate } from './migration/user.migrate'
import { UserModel } from './models/user.model'
import { UserInvolvedPartiesModel } from './models/user-involved-parties.model'
import { UserRoleModel } from './models/user-role.model'
import { IUserService } from './user.service.interface'

@Injectable()
export class UserService implements IUserService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @InjectModel(UserModel) private readonly userModel: typeof UserModel,
    @InjectModel(UserRoleModel)
    private readonly userRoleModel: typeof UserRoleModel,
    @InjectModel(AdvertInvolvedPartyModel)
    private readonly advertInvolvedPartyModel: typeof AdvertInvolvedPartyModel,
    @InjectModel(UserInvolvedPartiesModel)
    private readonly userInvolvedPartiesModel: typeof UserInvolvedPartiesModel,
  ) {}
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
