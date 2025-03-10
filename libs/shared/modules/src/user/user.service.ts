import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { GetUsersResponse, UserDto } from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'

import { Inject, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { UserModel } from './models/user.model'
import { IUserService } from './user.service.interface'

@Injectable()
export class UserService implements IUserService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @InjectModel(UserModel) private readonly userModel: typeof UserModel,
  ) {}

  async getUsers(user: UserDto): Promise<ResultWrapper<GetUsersResponse>> {
    return ResultWrapper.ok({
      users: [],
    })
  }
}
