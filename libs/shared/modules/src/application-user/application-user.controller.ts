import { USER_ROLES } from '@dmr.is/constants'
import { LogMethod, Roles } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import {
  ApplicationUserQuery,
  GetApplicationUser,
  GetApplicationUsers,
} from '@dmr.is/shared/dto'

import {
  Controller,
  Get,
  HttpException,
  Inject,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger'

import { RoleGuard, TokenJwtAuthGuard } from '../guards'
import { IApplicationUserService } from './application-user.service.interface'

@Controller({
  version: '1',
  path: 'application-users',
})
@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard, RoleGuard)
@Controller({
  version: '1',
  path: 'admin-users',
})
export class ApplicationUserController {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(IApplicationUserService)
    private readonly applicationUserService: IApplicationUserService,
  ) {}

  @Roles(USER_ROLES.Admin, USER_ROLES.Editor)
  @Get('/users')
  @ApiQuery({
    type: ApplicationUserQuery,
  })
  @ApiResponse({
    status: 200,
    type: GetApplicationUsers,
    description: 'Get application users',
  })
  @LogMethod()
  async getApplicationUsers(@Query() query: ApplicationUserQuery) {
    const results = await this.applicationUserService.getUsers(query)

    if (!results.result.ok) {
      throw new HttpException(
        results.result.error.message,
        results.result.error.code,
      )
    }

    return results.result.value
  }

  @Roles(USER_ROLES.Admin, USER_ROLES.Editor)
  @Get('users/:id')
  @ApiParam({ type: 'string', name: 'id' })
  @ApiResponse({
    status: 200,
    type: GetApplicationUser,
  })
  @LogMethod()
  async getApplicationUser(@Param('id') id: string) {
    const results = await this.applicationUserService.getUser(id)

    if (!results.result.ok) {
      throw new HttpException(
        results.result.error.message,
        results.result.error.code,
      )
    }

    return results.result.value
  }
}
