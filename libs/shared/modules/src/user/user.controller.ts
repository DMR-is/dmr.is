import { UserRoleEnum } from '@dmr.is/constants'
import { CurrentUser, Roles } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { GetUserResponse, GetUsersQuery, UserDto } from '@dmr.is/shared/dto'

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
import { ApiOperation, ApiResponse } from '@nestjs/swagger'

import { RoleGuard, TokenJwtAuthGuard } from '../guards'
import { IUserService } from './user.service.interface'

@Controller({
  path: 'users',
  version: '1',
})
@UseGuards(TokenJwtAuthGuard, RoleGuard)
@Roles(UserRoleEnum.Admin, UserRoleEnum.Editor)
export class UserController {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(IUserService) private readonly userService: IUserService,
  ) {}

  @Get('/')
  @ApiOperation({ operationId: 'getUsers' })
  @ApiResponse({ status: 200, type: GetUserResponse })
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
    const results = await this.userService.getUserByNationalId(nationalId)

    if (!results.result.ok) {
      throw new InternalServerErrorException('Could not get user')
    }

    return results.result.value
  }
}
