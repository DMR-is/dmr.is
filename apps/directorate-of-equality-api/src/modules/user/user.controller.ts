import { Controller, Get, Inject, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'

import { CurrentUser } from '@dmr.is/decorators'
import { type DMRUser } from '@dmr.is/island-auth-nest/dmrUser'
import { TokenJwtAuthGuard } from '@dmr.is/shared-modules'

import { AdminGuard } from '../../core/guards/admin/admin.guard'
import { DoeResponse } from '../../core/decorators/doe-response.decorator'
import { UserDto } from './dto/user.dto'
import { IUserService } from './user.service.interface'

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
  @DoeResponse({ operationId: 'getMyUser', type: UserDto })
  async getMyUser(@CurrentUser() user: DMRUser): Promise<UserDto> {
    return this.userService.getMyUser(user.nationalId)
  }
}
