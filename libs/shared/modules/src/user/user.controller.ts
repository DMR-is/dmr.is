import { UserRole } from '@dmr.is/constants'
import { CurrentUser, Roles } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { GetUserResponse, UserDto } from '@dmr.is/shared/dto'

import {
  Controller,
  ForbiddenException,
  Get,
  Inject,
  InternalServerErrorException,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common'
import { ApiResponse } from '@nestjs/swagger'

import { RoleGuard, TokenJwtAuthGuard } from '../guards'
import { IUserService } from './user.service.interface'

@Controller({
  path: 'users',
  version: '1',
})
@UseGuards(TokenJwtAuthGuard, RoleGuard)
@Roles(UserRole.Admin, UserRole.Editor)
export class UserController {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(IUserService) private readonly userService: IUserService,
  ) {}

  @Get('/')
  @ApiResponse({ status: 200, type: GetUserResponse })
  @ApiResponse({ status: 401, type: UnauthorizedException })
  @ApiResponse({ status: 403, type: ForbiddenException })
  @ApiResponse({ status: 500, type: InternalServerErrorException })
  async getUsers(@CurrentUser() user: UserDto) {
    const results = await this.userService.getUsers(user)

    if (!results.result.ok) {
      throw new InternalServerErrorException('Could not get users')
    }

    return results.result.value
  }
}
