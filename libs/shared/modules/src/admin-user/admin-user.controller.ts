import { USER_ROLES } from '@dmr.is/constants'
import { Roles } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import {
  CreateAdminUser,
  GetAdminUser,
  GetAdminUserRoles,
  GetAdminUsers,
  UpdateAdminUser,
} from '@dmr.is/shared/dto'

import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  InternalServerErrorException,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger'

import { RoleGuard, TokenJwtAuthGuard } from '../guards'
import { IAdminUserService } from './admin-user.service.interface'

@ApiBearerAuth()
@Controller({
  version: '1',
  path: 'admin-users',
})
@UseGuards(TokenJwtAuthGuard, RoleGuard)
@Roles(USER_ROLES.Admin)
export class AdminUserController {
  constructor(
    @Inject(IAdminUserService)
    private readonly adminUserService: IAdminUserService,

    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
  ) {}

  @Get('/roles')
  @ApiOperation({ operationId: 'getRoles' })
  @ApiResponse({ status: 200, type: GetAdminUserRoles })
  async getRoles() {
    const results = await this.adminUserService.getRoles()

    if (!results.result.ok) {
      throw new InternalServerErrorException('Could not get roles')
    }

    return results.result.value
  }

  @Get('/users')
  @ApiOperation({ operationId: 'getUsers' })
  @ApiResponse({ status: 200, type: GetAdminUsers })
  async getAllUsers() {
    const results = await this.adminUserService.getUsers()

    if (!results.result.ok) {
      throw new InternalServerErrorException('Could not get users')
    }

    return results.result.value
  }

  @Post('/users')
  @ApiOperation({ operationId: 'createUser' })
  @ApiNoContentResponse()
  async createAdminUser(@Body() body: CreateAdminUser) {
    const results = await this.adminUserService.createAdminUser(body)

    if (!results.result.ok) {
      throw new InternalServerErrorException('Could not create user')
    }
  }

  @Get('/users/:id')
  @ApiOperation({ operationId: 'getUserById' })
  @ApiResponse({ status: 200, type: GetAdminUser })
  async getUserById(@Param('id') id: string) {
    const results = await this.adminUserService.getUserById(id)

    if (!results.result.ok) {
      throw new InternalServerErrorException('Could not find user')
    }

    return results.result.value
  }

  @Get('/users/nationalId/:nationalId')
  @ApiOperation({ operationId: 'getUserByNationalId' })
  @ApiResponse({ status: 200, type: GetAdminUser })
  async getUserByNationalId(@Param('nationalId') nationalId: string) {
    const results = await this.adminUserService.getUserByNationalId(nationalId)

    if (!results.result.ok) {
      throw new InternalServerErrorException('Could not find user')
    }

    return results.result.value
  }

  @Put('/users/:id')
  @ApiOperation({ operationId: 'updateUser' })
  @ApiNoContentResponse()
  async updateUser(@Param('id') id: string, @Body() body: UpdateAdminUser) {
    const results = await this.adminUserService.updateUser(id, body)

    if (!results.result.ok) {
      throw new InternalServerErrorException('Could not update user')
    }
  }

  @Delete('/users/:id')
  @ApiOperation({ operationId: 'deleteUser' })
  @ApiNoContentResponse()
  async deleteUser(@Param('id') id: string) {
    const results = await this.adminUserService.deleteUser(id)

    if (!results.result.ok) {
      throw new InternalServerErrorException('Could not delete user')
    }
  }
}
