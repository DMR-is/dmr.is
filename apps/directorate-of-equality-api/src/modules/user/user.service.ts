import { Inject, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { GetUsersQueryDto } from './dto/get-users.query.dto'
import { UserDto } from './dto/user.dto'
import { UserModel } from './models/user.model'
import { IUserService } from './user.service.interface'

const LOGGING_CONTEXT = 'UserService'

@Injectable()
export class UserService implements IUserService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @InjectModel(UserModel) private readonly userModel: typeof UserModel,
  ) {}

  async getMyUser(nationalId: string): Promise<UserDto> {
    this.logger.debug(`Getting user with national ID ${nationalId}`, {
      context: LOGGING_CONTEXT,
    })

    const user = await this.userModel.findOneOrThrow({
      where: { nationalId },
    })

    return user.fromModel()
  }

  async getUsers({ showInactive }: GetUsersQueryDto): Promise<UserDto[]> {
    this.logger.debug(
      `Listing users${showInactive ? ' (including inactive)' : ''}`,
      { context: LOGGING_CONTEXT },
    )

    const users = await this.userModel.findAll({
      where: showInactive ? undefined : { isActive: true },
      order: [
        ['firstName', 'ASC'],
        ['lastName', 'ASC'],
      ],
    })

    return users.map((user) => user.fromModel())
  }
}
