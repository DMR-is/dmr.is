import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { UserDto } from './dto/user.dto'
import { UserModel } from './users.model'
import { IUsersService } from './users.service.interface'

@Injectable()
export class UsersService implements IUsersService {
  constructor(
    @InjectModel(UserModel)
    private readonly userModel: typeof UserModel,
  ) {}

  async getUserByNationalId(nationalId: string): Promise<UserDto> {
    const user = await this.userModel.findOne({
      where: { nationalId },
    })

    if (!user) {
      throw new NotFoundException(
        `User not found`,
      )
    }

    return user.fromModel()
  }
}
