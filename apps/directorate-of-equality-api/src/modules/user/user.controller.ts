import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'

import { CurrentUser } from '@dmr.is/decorators'
import { type DMRUser } from '@dmr.is/island-auth-nest/dmrUser'
import { TokenJwtAuthGuard } from '@dmr.is/shared-modules'

import { DoeResponse } from '../../core/decorators/doe-response.decorator'
import { AdminGuard } from '../../core/guards/admin/admin.guard'
import { RequireAdminRoleGuard } from '../../core/guards/admin-role/require-admin-role.guard'
import { CreateUserBodyDto } from './dto/create-user.body.dto'
import { GetUsersQueryDto } from './dto/get-users.query.dto'
import { UpdateUserBodyDto } from './dto/update-user.body.dto'
import { UserDto } from './dto/user.dto'
import { UserModel } from './models/user.model'
import { IUserService } from './user.service.interface'

type RequestWithAdminUser = { adminUser: UserModel }

@Controller({
  path: 'users',
  version: '1',
})
@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard, AdminGuard)
export class UserController {
  constructor(
    @Inject(IUserService) private readonly userService: IUserService,
  ) {}

  @Get('me')
  @DoeResponse({ operationId: 'getMyUser', type: UserDto, include404: true })
  async getMyUser(@CurrentUser() user: DMRUser): Promise<UserDto> {
    return this.userService.getMyUser(user.nationalId)
  }

  @Get()
  @DoeResponse({ operationId: 'getUsers', type: [UserDto] })
  async getUsers(@Query() query: GetUsersQueryDto): Promise<UserDto[]> {
    return this.userService.getUsers(query)
  }

  @Post()
  @UseGuards(RequireAdminRoleGuard)
  @DoeResponse({ operationId: 'createUser', type: UserDto, status: 201 })
  async createUser(@Body() body: CreateUserBodyDto): Promise<UserDto> {
    return this.userService.createUser(body)
  }

  @Patch(':id')
  @UseGuards(RequireAdminRoleGuard)
  @DoeResponse({ operationId: 'updateUser', type: UserDto, include404: true })
  async updateUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateUserBodyDto,
    @Req() req: RequestWithAdminUser,
  ): Promise<UserDto> {
    return this.userService.updateUser(id, body, req.adminUser.id)
  }

  @Delete(':id')
  @UseGuards(RequireAdminRoleGuard)
  @HttpCode(204)
  @DoeResponse({ operationId: 'deleteUser', status: 204, include404: true })
  async deleteUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: RequestWithAdminUser,
  ): Promise<void> {
    await this.userService.softDeleteUser(id, req.adminUser.id)
  }
}
