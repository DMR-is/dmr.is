import { UserRoleEnum } from '@dmr.is/constants'
import { CurrentUser, Roles } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import {
  GetInvoledPartiesByUserResponse,
  GetRolesByUserResponse,
  GetUserResponse,
  GetUsersQuery,
  GetUsersResponse,
  UserDto,
} from '@dmr.is/shared/dto'

import {
  Controller,
  ForbiddenException,
  Get,
  Inject,
  InternalServerErrorException,
  Param,
  Query,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger'

import { RoleGuard, TokenJwtAuthGuard } from '../guards'
import { IUserService } from './user.service.interface'

@Controller({
  path: 'users',
  version: '1',
})
@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard, RoleGuard)
@Roles(UserRoleEnum.Admin, UserRoleEnum.Editor)
export class UserController {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(IUserService) private readonly userService: IUserService,
  ) {}

  @Get('/')
  @ApiOperation({ operationId: 'getUsers' })
  @ApiResponse({ status: 200, type: GetUsersResponse })
  @ApiResponse({ status: 401, type: UnauthorizedException })
  @ApiResponse({ status: 403, type: ForbiddenException })
  @ApiResponse({ status: 500, type: InternalServerErrorException })
  async getUsers(@Query() query: GetUsersQuery, @CurrentUser() user: UserDto) {
    const results = await this.userService.getUsers(query, user)

    if (!results.result.ok) {
      throw new InternalServerErrorException('Could not get users')
    }

    return results.result.value
  }

  @Get('nationalId/:nationalId')
  @ApiOperation({ operationId: 'getUserByNationalId' })
  @ApiResponse({ status: 200, type: GetUserResponse })
  @ApiResponse({ status: 401, type: UnauthorizedException })
  @ApiResponse({ status: 403, type: ForbiddenException })
  @ApiResponse({ status: 500, type: InternalServerErrorException })
  async getUserByNationalId(@Param('nationalId') nationalId: string) {
    this.logger.info('Getting user by nationalId', { nationalId })
    const results = await this.userService.getUserByNationalId(nationalId)

    if (!results.result.ok) {
      throw new InternalServerErrorException('Could not get user')
    }

    return results.result.value
  }

  @Get('roles')
  @ApiOperation({ operationId: 'getRolesByUser' })
  @ApiResponse({ status: 200, type: GetRolesByUserResponse })
  @ApiResponse({ status: 401, type: UnauthorizedException })
  @ApiResponse({ status: 403, type: ForbiddenException })
  @ApiResponse({ status: 500, type: InternalServerErrorException })
  async getRolesByUser(@CurrentUser() currentUser: UserDto) {
    const results = await this.userService.getRolesByUser(currentUser)

    if (!results.result.ok) {
      throw new InternalServerErrorException('Could not get roles')
    }

    return results.result.value
  }

  @Get('involved-parties')
  @ApiOperation({ operationId: 'getInvolvedPartiesByUser' })
  @ApiResponse({ status: 200, type: GetInvoledPartiesByUserResponse })
  @ApiResponse({ status: 401, type: UnauthorizedException })
  @ApiResponse({ status: 403, type: ForbiddenException })
  @ApiResponse({ status: 500, type: InternalServerErrorException })
  async getInvolvedPartiesByUser(@CurrentUser() currentUser: UserDto) {
    const results = await this.userService.getInvolvedPartiesByUser(currentUser)

    if (!results.result.ok) {
      throw new InternalServerErrorException('Could not get involved parties')
    }

    return results.result.value
  }
}
