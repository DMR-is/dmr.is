import { Op } from 'sequelize'

import { BadRequestException, Inject, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { DMRUser } from '@dmr.is/auth/dmrUser'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { PagingQuery } from '@dmr.is/shared-dto'
import { generatePaging, getLimitAndOffset } from '@dmr.is/utils/server/serverUtils'

import {
  CreateUserDto,
  GetUsersResponse,
  GetUsersWithPagingResponse,
  UpdateUserDto,
  UserDto,
  UserModel,
} from '../../models/users.model'
import { LGNationalRegistryService } from '../national-registry/national-registry.service'
import { ILGNationalRegistryService } from '../national-registry/national-registry.service.interface'
import { IUsersService } from './users.service.interface'

const LOGGING_CONTEXT = 'UsersService'

@Injectable()
export class UsersService implements IUsersService {
  constructor(
    @InjectModel(UserModel)
    private readonly userModel: typeof UserModel,
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,

    @Inject(ILGNationalRegistryService)
    private readonly nationalRegistryService: LGNationalRegistryService,
  ) {}
  async restoreUser(userId: string, user: DMRUser): Promise<UserDto> {
    const userToRestore = await this.userModel.findByPkOrThrow(userId, {
      paranoid: false,
    })

    await userToRestore.restore()

    this.logger.info('Admin user restored', {
      restoredByUserId: user.adminUserId,
      restoredUserId: userId,
      context: LOGGING_CONTEXT,
    })

    return userToRestore.fromModel()
  }
  async updateUser(
    userId: string,
    body: UpdateUserDto,
    user: DMRUser,
  ): Promise<UserDto> {
    const userToUpdate = await this.userModel.findByPkOrThrow(userId)

    await userToUpdate.update({
      email: body.email,
      phone: body.phone,
    })

    this.logger.info('Admin user updated', {
      updatedByUserId: user.adminUserId,
      updatedUserId: userId,
      context: LOGGING_CONTEXT,
    })

    return userToUpdate.fromModel()
  }
  async deleteUser(userId: string, user: DMRUser): Promise<void> {
    if (userId === user.adminUserId) {
      this.logger.warn('Admin user attempted to delete themselves', {
        attemptedByUserId: user.adminUserId,
        context: LOGGING_CONTEXT,
      })
      throw new BadRequestException('Admin users cannot delete themselves')
    }

    await this.userModel.destroy({
      where: { id: userId },
      force: false,
    })

    this.logger.info('Admin user deleted', {
      deletedByUserId: user.adminUserId,
      deletedUserId: userId,
      context: LOGGING_CONTEXT,
    })
  }
  async createUser(body: CreateUserDto, user: DMRUser): Promise<UserDto> {
    const softDeletedUser = await this.userModel.findOne({
      where: { nationalId: body.nationalId, deletedAt: { [Op.ne]: null } },
      paranoid: false,
    })

    if (softDeletedUser !== null) {
      await softDeletedUser.restore()

      this.logger.info('Admin user restored from soft delete', {
        restoredUserId: softDeletedUser.id,
        restoredByUserId: user.adminUserId,
        context: LOGGING_CONTEXT,
      })

      return softDeletedUser.fromModel()
    }

    const { entity } = await this.nationalRegistryService.getEntityByNationalId(
      body.nationalId,
    )

    if (!entity) {
      this.logger.warn(`No entity found with nationalId`, {
        context: LOGGING_CONTEXT,
      })
      throw new BadRequestException('No entity found with given nationalId')
    }

    const split = entity.nafn.split(' ')
    const firstName = split[0]
    const lastName = split.slice(1).join(' ')

    const newUser = await this.userModel.create({
      nationalId: body.nationalId,
      firstName: firstName,
      lastName: lastName,
      email: body.email,
      phone: body.phone,
    })

    this.logger.info('Admin user created', {
      createdByUserId: user.adminUserId,
      newUserId: newUser.id,
      context: LOGGING_CONTEXT,
    })

    return newUser.fromModel()
  }
  async getUsers(query: PagingQuery): Promise<GetUsersWithPagingResponse> {
    const { limit, offset } = getLimitAndOffset(query)
    const usersResults = await this.userModel.findAndCountAll({
      limit,
      offset,
    })

    const users = usersResults.rows.map((user) => user.fromModel())
    const paging = generatePaging(
      usersResults.rows,
      query.page,
      query.pageSize,
      usersResults.count,
    )

    return {
      users,
      paging,
    }
  }

  async getEmployees(): Promise<GetUsersResponse> {
    const employees = await this.userModel.findAll()
    return { users: employees.map((user) => user.fromModel()) }
  }

  async getUserByNationalId(
    nationalId: string,
    paranoid?: boolean,
  ): Promise<UserDto> {
    const user = await this.userModel.findOneOrThrow({
      where: { nationalId },
      paranoid: paranoid ?? true,
    })

    return user.fromModel()
  }
}
