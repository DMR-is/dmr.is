import { Controller, Get, Inject, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger'

import { CurrentUser } from '@dmr.is/decorators'
import { type DMRUser } from '@dmr.is/island-auth-nest/dmrUser'
import { TokenJwtAuthGuard } from '@dmr.is/shared-modules'

import { UserDto } from './dto/user.dto'
import { IUserService } from './user.service.interface'

@Controller({
  path: 'users',
  version: '1',
})
@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard)
export class UserController {
  constructor(
    @Inject(IUserService) private readonly userService: IUserService,
  ) {}

  @Get('me')
  @ApiOperation({ operationId: 'getMyUser' })
  @ApiResponse({ status: 200, type: UserDto })
  async getMyUser(@CurrentUser() user: DMRUser): Promise<UserDto> {
    return this.userService.getMyUser(user.nationalId)
  }
}
