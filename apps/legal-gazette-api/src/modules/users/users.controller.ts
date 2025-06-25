import { Controller, Get, Inject, UseGuards } from '@nestjs/common'
import { ApiBearerAuth } from '@nestjs/swagger'

import { CurrentUser } from '@dmr.is/decorators'
import { LGResponse } from '@dmr.is/legal-gazette/decorators'
import { TokenJwtAuthGuard } from '@dmr.is/modules'

import { UserDto } from './dto/user.dto'
import { IUsersService } from './users.service.interface'

@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard)
@Controller({
  path: 'users',
  version: '1',
})
export class UsersController {
  constructor(
    @Inject(IUsersService)
    private readonly usersService: IUsersService,
  ) {}

  @Get('me')
  @LGResponse({
    operationId: 'getMyUser',
    type: UserDto,
  })
  getMyUser(@CurrentUser() user: UserDto) {
    return this.usersService.getUserByNationalId(user.nationalId)
  }
}
