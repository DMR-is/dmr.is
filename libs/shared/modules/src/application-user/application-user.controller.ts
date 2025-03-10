import { UserRole } from '@dmr.is/constants'
import { Roles } from '@dmr.is/decorators'
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
  UseGuards,
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOperation,
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
@Roles(UserRole.Admin, UserRole.Editor)
export class ApplicationUserController {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(IApplicationUserService)
    private readonly applicationUserService: IApplicationUserService,
  ) {}

  @Get()
  @ApiOperation({ operationId: 'getApplicationUsers' })
  @ApiResponse({ status: 200, type: GetApplicationUsers })
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

  @Get('/:id')
  @ApiOperation({ operationId: 'getApplicationUser' })
  @ApiResponse({ status: 200, type: GetApplicationUser })
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

  @Post('/')
  @ApiOperation({ operationId: 'createApplicationUser' })
  @ApiResponse({ status: 201, type: GetApplicationUser })
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

  @Delete('/:id')
  @ApiOperation({ operationId: 'deleteApplicationUser' })
  @ApiNoContentResponse()
  async deleteApplicationUser(@Param('id') id: string) {
    const results = await this.applicationUserService.deleteUser(id)

    if (!results.result.ok) {
      throw new HttpException(
        results.result.error.message,
        results.result.error.code,
      )
    }
  }

  @Put('/:id')
  @ApiOperation({ operationId: 'updateApplicationUser' })
  @ApiResponse({ type: GetApplicationUser })
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
