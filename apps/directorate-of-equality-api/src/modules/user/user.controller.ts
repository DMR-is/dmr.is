import { Controller, Get, Inject, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'

import { CurrentUser } from '@dmr.is/decorators'
import { type DMRUser } from '@dmr.is/island-auth-nest/dmrUser'
import { ApiErrorDto } from '@dmr.is/shared-dto'
import { TokenJwtAuthGuard } from '@dmr.is/shared-modules'

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
  @ApiOperation({ operationId: 'getMyUser' })
  @ApiResponse({ status: 200, type: UserDto })
  @ApiResponse({ status: 401, type: ApiErrorDto })
  @ApiResponse({ status: 403, type: ApiErrorDto })
  @ApiResponse({ status: 404, type: ApiErrorDto })
  async getMyUser(@CurrentUser() user: DMRUser): Promise<UserDto> {
    return this.userService.getMyUser(user.nationalId)
  }
}
