import { USER_ROLES } from '@dmr.is/constants'
import { LogMethod, Roles } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import {
  AdminUser,
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
  ApiBody,
  ApiNoContentResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger'

import { RoleGuard, TokenJwtAuthGuard } from '../guards'
import { IAdminUserService } from './admin-user.service.interface'

@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard, RoleGuard)
@Controller({
  version: '1',
  path: 'admin-users',
})
export class AdminUserController {
  constructor(
    @Inject(IAdminUserService)
    private readonly adminUserService: IAdminUserService,

    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
  ) {}

  @Roles(USER_ROLES.Admin)
  @Get('/roles')
  @ApiOperation({ operationId: 'getRoles' })
  @ApiResponse({ status: 200, type: GetAdminUserRoles })
  @LogMethod()
  async getRoles() {
    const results = await this.adminUserService.getRoles()

    if (!results.result.ok) {
      throw new InternalServerErrorException('Could not get roles')
    }

    return results.result.value
  }

  @Roles(USER_ROLES.Admin)
  @Get('/users')
  @ApiOperation({ operationId: 'getUsers' })
  @ApiResponse({ status: 200, type: GetAdminUsers })
  @LogMethod()
  async getAllUsers() {
    const results = await this.adminUserService.getUsers()

    if (!results.result.ok) {
      throw new InternalServerErrorException('Could not get users')
    }

    return results.result.value
  }

  @Roles(USER_ROLES.Admin)
  @Post('/users')
  @ApiOperation({ operationId: 'createUser' })
  @ApiBody({ type: CreateAdminUser })
  @ApiNoContentResponse()
  @LogMethod()
  async createAdminUser(@Body() body: CreateAdminUser) {
    const results = await this.adminUserService.createAdminUser(body)

    if (!results.result.ok) {
      throw new InternalServerErrorException('Could not create user')
    }
  }

  @Roles(USER_ROLES.Admin)
  @Get('/users/:id')
  @ApiParam({ name: 'id', type: 'string' })
  @ApiOperation({ operationId: 'getUserById' })
  @ApiResponse({ status: 200, type: AdminUser })
  @LogMethod()
  async getUserById(@Param('id') id: string) {
    const results = await this.adminUserService.getUserById(id)

    if (!results.result.ok) {
      throw new InternalServerErrorException('Could not find user')
    }

    return results.result.value
  }

  @Roles(USER_ROLES.Admin)
  @Get('/users/nationalId/:nationalId')
  @ApiParam({ name: 'nationalId', type: 'string' })
  @ApiOperation({ operationId: 'getUserByNationalId' })
  @ApiResponse({ status: 200, type: GetAdminUser })
  @LogMethod()
  async getUserByNationalId(@Param('nationalId') nationalId: string) {
    const results = await this.adminUserService.getUserByNationalId(nationalId)

    if (!results.result.ok) {
      throw new InternalServerErrorException('Could not find user')
    }

    return results.result.value
  }

  @Roles(USER_ROLES.Admin)
  @Put('/users/:id')
  @ApiParam({ name: 'id', type: 'string' })
  @ApiOperation({ operationId: 'updateUser' })
  @ApiNoContentResponse()
  @ApiBody({ type: UpdateAdminUser })
  @LogMethod()
  async updateUser(@Param('id') id: string, @Body() body: UpdateAdminUser) {
    const results = await this.adminUserService.updateUser(id, body)

    if (!results.result.ok) {
      throw new InternalServerErrorException('Could not update user')
    }
  }

  @Roles(USER_ROLES.Admin)
  @Delete('/users/:id')
  @ApiParam({ name: 'id', type: 'string' })
  @ApiOperation({ operationId: 'deleteUser' })
  @ApiNoContentResponse()
  @LogMethod()
  async deleteUser(@Param('id') id: string) {
    const results = await this.adminUserService.deleteUser(id)

    if (!results.result.ok) {
      throw new InternalServerErrorException('Could not delete user')
    }
  }
}
