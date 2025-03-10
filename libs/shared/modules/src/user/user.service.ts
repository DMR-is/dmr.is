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

import { Inject, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { userMigrate } from './migration/user.migrate'
import { UserModel } from './models/user.model'
import { IUserService } from './user.service.interface'

@Injectable()
export class UserService implements IUserService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @InjectModel(UserModel) private readonly userModel: typeof UserModel,
  ) {}
  getUsersByInvolvedPartyId(
    involvedPartyId: string,
    currentUser: UserDto,
  ): Promise<ResultWrapper<GetUsersResponse>> {
    throw new Error('Method not implemented.')
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

  async getUsers(
    query: GetUsersQuery,
    currentUser: UserDto,
  ): Promise<ResultWrapper<GetUsersResponse>> {
    const users = await this.userModel.findAll()
    const migrated = users.map((user) => userMigrate(user))

    return ResultWrapper.ok({
      users: migrated,
    })
  }
}
