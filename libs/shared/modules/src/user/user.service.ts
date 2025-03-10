import { Op } from 'sequelize'
import { UserRoleEnum } from '@dmr.is/constants'
import { LogAndHandle } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import {
  GetUserResponse,
  GetUsersQuery,
  GetUsersResponse,
  UserDto,
} from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'
import { generatePaging, getLimitAndOffset } from '@dmr.is/utils'

import { Inject, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { AdvertInvolvedPartyModel } from '../journal/models'
import { userMigrate } from './migration/user.migrate'
import { UserModel } from './models/user.model'
import { IUserService } from './user.service.interface'

@Injectable()
export class UserService implements IUserService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @InjectModel(UserModel) private readonly userModel: typeof UserModel,
  ) {}
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

    const users = await this.userModel.findAll({
      limit,
      offset,
      include: [
        {
          model: AdvertInvolvedPartyModel,
          where: {
            id: {
              required: true,
              [Op.in]: involedPartyIds,
            },
          },
        },
      ],
    })

    const migrated = users.map((user) => userMigrate(user))
    const paging = generatePaging(
      users,
      query.page,
      query.pageSize,
      users.length,
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

    if (query.involedPartyIds?.length) {
      hasInvolvedPartyFilter = true
      Object.assign(whereParams, {
        id: {
          [Op.in]: query.involedPartyIds,
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
      include: [
        {
          required: hasInvolvedPartyFilter,
          model: AdvertInvolvedPartyModel,
          where: whereParams,
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
