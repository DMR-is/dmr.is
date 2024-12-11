import { USER_ROLES } from '@dmr.is/constants'
import { LogMethod, Roles } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import {
  ApplicationUserQuery,
  CreateApplicationUser,
  GetApplicationUser,
  GetApplicationUsers,
  UpdateApplicationUser,
} from '@dmr.is/shared/dto'

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  Inject,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiBody,
  ApiNoContentResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger'

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
  @Get()
  @ApiOperation({
    operationId: 'getApplicationUsers',
  })
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
  @Get('/:id')
  @ApiOperation({
    operationId: 'getApplicationUser',
  })
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

  @Roles(USER_ROLES.Admin, USER_ROLES.Editor)
  @Post('/')
  @ApiOperation({
    operationId: 'createApplicationUser',
  })
  @ApiBody({
    type: CreateApplicationUser,
  })
  @ApiResponse({
    status: 201,
    type: GetApplicationUser,
  })
  @LogMethod()
  async createApplicationUser(@Body() body: CreateApplicationUser) {
    const results = await this.applicationUserService.createUser(body)

    if (!results.result.ok) {
      throw new HttpException(
        results.result.error.message,
        results.result.error.code,
      )
    }

    return results.result.value
  }

  @Roles(USER_ROLES.Admin, USER_ROLES.Editor)
  @Delete('/:id')
  @ApiOperation({
    operationId: 'deleteApplicationUser',
  })
  @ApiParam({ type: 'string', name: 'id' })
  @ApiNoContentResponse()
  @LogMethod()
  async deleteApplicationUser(@Param('id') id: string) {
    const results = await this.applicationUserService.deleteUser(id)

    if (!results.result.ok) {
      throw new HttpException(
        results.result.error.message,
        results.result.error.code,
      )
    }
  }

  @Roles(USER_ROLES.Admin, USER_ROLES.Editor)
  @Put('/:id')
  @ApiOperation({
    operationId: 'updateApplicationUser',
  })
  @ApiBody({
    type: UpdateApplicationUser,
  })
  @ApiParam({ type: 'string', name: 'id' })
  @ApiResponse({
    type: GetApplicationUser,
  })
  @LogMethod()
  async updateApplicationUser(
    @Param('id') id: string,
    @Body() body: UpdateApplicationUser,
  ) {
    const results = await this.applicationUserService.updateUser(id, body)

    if (!results.result.ok) {
      throw new HttpException(
        results.result.error.message,
        results.result.error.code,
      )
    }

    return results.result.value
  }
}
