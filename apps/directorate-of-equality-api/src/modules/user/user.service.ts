import { Inject, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

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
}
