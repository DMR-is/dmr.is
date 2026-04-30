import { Controller, Get, Inject, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'

import { CurrentUser } from '@dmr.is/decorators'
import { type DMRUser } from '@dmr.is/island-auth-nest/dmrUser'
import { TokenJwtAuthGuard } from '@dmr.is/shared-modules'

import { DoeResponse } from '../../core/decorators/doe-response.decorator'
import { AdminGuard } from '../../core/guards/admin/admin.guard'
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
  @DoeResponse({ operationId: 'getMyUser', type: UserDto, errors: [400, 401, 403, 404, 500] })
  async getMyUser(@CurrentUser() user: DMRUser): Promise<UserDto> {
    return this.userService.getMyUser(user.nationalId)
  }
}
