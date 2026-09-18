import { Op } from 'sequelize'

import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { CreateUserBodyDto } from './dto/create-user.body.dto'
import { GetUsersQueryDto } from './dto/get-users.query.dto'
import { UpdateUserBodyDto } from './dto/update-user.body.dto'
import { UserDto } from './dto/user.dto'
import { UserModel } from './models/user.model'
import { DoeUserRole } from './types/user-role'
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

  async createUser(input: CreateUserBodyDto): Promise<UserDto> {
    this.logger.info(`Creating user with national ID ${input.nationalId}`, {
      context: LOGGING_CONTEXT,
    })

    const conflict = await this.userModel.findOne({
      where: {
        [Op.or]: [{ nationalId: input.nationalId }, { email: input.email }],
      },
    })

    if (conflict) {
      const field =
        conflict.nationalId === input.nationalId ? 'national ID' : 'email'
      throw new ConflictException(`User with this ${field} already exists`)
    }

    const user = await this.userModel.create({
      nationalId: input.nationalId,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone ?? null,
      role: input.role,
    })

    return user.fromModel()
  }

  async updateUser(
    id: string,
    input: UpdateUserBodyDto,
    actorId: string,
  ): Promise<UserDto> {
    this.logger.info(`Updating user ${id}`, { context: LOGGING_CONTEXT })

    const user = await this.userModel.findByPkOrThrow(id)

    const willDemote = input.role === DoeUserRole.EDITOR
    const willDeactivate = input.isActive === false

    if (actorId === id && (willDemote || willDeactivate)) {
      throw new BadRequestException(
        'You cannot demote or deactivate your own account',
      )
    }

    const wasAdminAndActive =
      user.role === DoeUserRole.ADMIN && user.isActive === true
    const losingAdmin = wasAdminAndActive && (willDemote || willDeactivate)

    if (losingAdmin) {
      const otherActiveAdmins = await this.userModel.count({
        where: {
          role: DoeUserRole.ADMIN,
          isActive: true,
          id: { [Op.ne]: id },
        },
      })

      if (otherActiveAdmins === 0) {
        throw new BadRequestException(
          'Cannot demote or deactivate the last active admin',
        )
      }
    }

    if (input.email !== undefined && input.email !== user.email) {
      const conflict = await this.userModel.findOne({
        where: { email: input.email, id: { [Op.ne]: id } },
      })
      if (conflict) {
        throw new ConflictException('User with this email already exists')
      }
    }

    if (input.firstName !== undefined) user.firstName = input.firstName
    if (input.lastName !== undefined) user.lastName = input.lastName
    if (input.email !== undefined) user.email = input.email
    if (input.phone !== undefined) user.phone = input.phone
    if (input.isActive !== undefined) user.isActive = input.isActive
    if (input.role !== undefined) user.role = input.role

    await user.save()

    return user.fromModel()
  }

  async softDeleteUser(id: string, actorId: string): Promise<void> {
    this.logger.info(`Soft-deleting user ${id}`, { context: LOGGING_CONTEXT })

    if (actorId === id) {
      throw new BadRequestException('You cannot deactivate your own account')
    }

    const user = await this.userModel.findByPkOrThrow(id)

    if (!user.isActive) {
      return
    }

    if (user.role === DoeUserRole.ADMIN) {
      const otherActiveAdmins = await this.userModel.count({
        where: {
          role: DoeUserRole.ADMIN,
          isActive: true,
          id: { [Op.ne]: id },
        },
      })

      if (otherActiveAdmins === 0) {
        throw new BadRequestException(
          'Cannot deactivate the last active admin',
        )
      }
    }

    user.isActive = false
    await user.save()
  }
}
