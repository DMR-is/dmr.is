import { Controller, Get, Inject, UseGuards } from '@nestjs/common'
import { ApiBearerAuth } from '@nestjs/swagger'

import { CurrentUser } from '@dmr.is/decorators'
import { ScopesGuard, TokenJwtAuthGuard } from '@dmr.is/modules/guards/auth'

import { AdminOnly } from '../../core/decorators/admin.decorator'
import { LGResponse } from '../../core/decorators/lg-response.decorator'
import { AdminGuard } from '../../core/guards/admin.guard'
import { GetUsersResponse, UserDto } from '../../models/users.model'
import { IUsersService } from './users.service.interface'

@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard, ScopesGuard, AdminGuard)
@AdminOnly()
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

  @Get('employees')
  @LGResponse({ operationId: 'getEmployees', type: GetUsersResponse })
  getEmployees() {
    return this.usersService.getEmployees()
  }
}
