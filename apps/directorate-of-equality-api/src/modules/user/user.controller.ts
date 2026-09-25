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
import { ApiBearerAuth, ApiParam, ApiTags } from '@nestjs/swagger'

import { CurrentUser } from '@dmr.is/decorators'
import {
  CreateUserBodyDto,
  GetUsersQueryDto,
  IUserService,
  UpdateUserBodyDto,
  UserDto,
  UserLookupDto,
  UserModel,
} from '@dmr.is/doe-modules/user'
import { type DMRUser } from '@dmr.is/island-auth-nest/dmrUser'
import { TokenJwtAuthGuard } from '@dmr.is/shared-modules'

import { DoeResponse } from '../../core/decorators/doe-response.decorator'
import { AdminGuard } from '../../core/guards/admin/admin.guard'
import { RequireAdminRoleGuard } from '../../core/guards/admin-role/require-admin-role.guard'
import { ParseNationalIdPipe } from '../../core/pipes/parse-national-id.pipe'

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

  @Get('lookup/:nationalId')
  @UseGuards(RequireAdminRoleGuard)
  @ApiParam({ name: 'nationalId', type: String })
  @DoeResponse({
    operationId: 'lookupUserNationalRegistry',
    type: UserLookupDto,
    include404: true,
    description:
      'The person the national registry has for a kennitala, to pre-fill a new user. Requires the ADMIN role, as creating one does. `400` for a company kennitala, `404` when the registry has no one. `alreadyUser` flags a kennitala that is already a user.',
  })
  async lookupNationalRegistry(
    @Param('nationalId', ParseNationalIdPipe) nationalId: string,
  ): Promise<UserLookupDto> {
    return this.userService.lookupNationalRegistry(nationalId)
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
