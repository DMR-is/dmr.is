import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { GetUsersResponse, UserDto } from './dto/user.dto'
import { UserModel } from './users.model'
import { IUsersService } from './users.service.interface'

@Injectable()
export class UsersService implements IUsersService {
  constructor(
    @InjectModel(UserModel)
    private readonly userModel: typeof UserModel,
  ) {}

  async getEmployees(): Promise<GetUsersResponse> {
    const employees = await this.userModel.findAll()
    return { users: employees.map((user) => user.fromModel()) }
  }

  async getUserByNationalId(nationalId: string): Promise<UserDto> {
    const user = await this.userModel.findOneOrThrow({
      where: { nationalId },
    })

    return user.fromModel()
  }
}
