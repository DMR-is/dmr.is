import { UserRoleEnum } from '@dmr.is/constants'
import { CurrentUser, Roles } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { ResultWrapper } from '@dmr.is/types'

import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Inject,
  InternalServerErrorException,
  Param,
  Post,
  Put,
  Query,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger'

import { IUserService } from './user.service.interface'

import { TokenJwtAuthGuard } from '@dmr.is/official-journal/guards'
import {
  CreateUserDto,
  GetInvoledPartiesByUserResponse,
  GetRolesByUserResponse,
  GetUserResponse,
  GetUsersQuery,
  GetUsersResponse,
  UpdateUserDto,
} from './dto/user.dto'
import { RoleGuard } from './role.guard'
import { UserDto } from '@dmr.is/official-journal/dto'

@Controller({
  path: 'users',
  version: '1',
})
@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard, RoleGuard)
@Roles(UserRoleEnum.Admin, UserRoleEnum.Editor)
export class UserController {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(IUserService) private readonly userService: IUserService,
  ) {}

  @Get('/')
  @ApiOperation({ operationId: 'getUsers' })
  @ApiResponse({ status: 200, type: GetUsersResponse })
  @ApiResponse({ status: 401, type: UnauthorizedException })
  @ApiResponse({ status: 403, type: ForbiddenException })
  @ApiResponse({ status: 500, type: InternalServerErrorException })
  async getUsers(@Query() query: GetUsersQuery, @CurrentUser() user: UserDto) {
    const results = await this.userService.getUsers(query, user)

    if (!results.result.ok) {
      throw new InternalServerErrorException('Could not get users')
    }

    return results.result.value
  }

  @Put('/:id')
  @ApiOperation({ operationId: 'updateUser' })
  @ApiResponse({ status: 200, type: GetUserResponse })
  @ApiResponse({ status: 401, type: UnauthorizedException })
  @ApiResponse({ status: 403, type: ForbiddenException })
  async updateUser(
    @Param('id') id: string,
    @Body() body: UpdateUserDto,
    @CurrentUser() currentUser: UserDto,
  ) {
    return ResultWrapper.unwrap(
      await this.userService.updateUser(id, body, currentUser),
    )
  }

  @Delete('/:id')
  @ApiOperation({ operationId: 'deleteUser' })
  @ApiNoContentResponse()
  @ApiResponse({ status: 401, type: UnauthorizedException })
  @ApiResponse({ status: 403, type: ForbiddenException })
  @ApiResponse({ status: 500, type: InternalServerErrorException })
  async deleteUser(
    @Param('id') id: string,
    @CurrentUser() currentUser: UserDto,
  ) {
    ResultWrapper.unwrap(await this.userService.deleteUser(id, currentUser))
  }

  @Get('nationalId/:nationalId')
  @ApiOperation({ operationId: 'getUserByNationalId' })
  @ApiResponse({ status: 200, type: GetUserResponse })
  @ApiResponse({ status: 401, type: UnauthorizedException })
  @ApiResponse({ status: 403, type: ForbiddenException })
  @ApiResponse({ status: 500, type: InternalServerErrorException })
  async getUserByNationalId(@Param('nationalId') nationalId: string) {
    this.logger.info('Getting user by nationalId', { nationalId })
    const results = await this.userService.getUserByNationalId(nationalId)

    if (!results.result.ok) {
      throw new InternalServerErrorException('Could not get user')
    }

    return results.result.value
  }

  @Get('roles')
  @ApiOperation({ operationId: 'getRolesByUser' })
  @ApiResponse({ status: 200, type: GetRolesByUserResponse })
  @ApiResponse({ status: 401, type: UnauthorizedException })
  @ApiResponse({ status: 403, type: ForbiddenException })
  @ApiResponse({ status: 500, type: InternalServerErrorException })
  async getRolesByUser(@CurrentUser() currentUser: UserDto) {
    const results = await this.userService.getRolesByUser(currentUser)

    if (!results.result.ok) {
      throw new InternalServerErrorException('Could not get roles')
    }

    return results.result.value
  }

  @Get('involved-parties')
  @ApiOperation({ operationId: 'getInvolvedPartiesByUser' })
  @ApiResponse({ status: 200, type: GetInvoledPartiesByUserResponse })
  @ApiResponse({ status: 401, type: UnauthorizedException })
  @ApiResponse({ status: 403, type: ForbiddenException })
  @ApiResponse({ status: 500, type: InternalServerErrorException })
  async getInvolvedPartiesByUser(@CurrentUser() currentUser: UserDto) {
    const results = await this.userService.getInvolvedPartiesByUser(currentUser)

    if (!results.result.ok) {
      throw new InternalServerErrorException('Could not get involved parties')
    }

    return results.result.value
  }

  @Post()
  @ApiOperation({ operationId: 'createUser' })
  @ApiResponse({ status: 200, type: GetUserResponse })
  @ApiResponse({ status: 401, type: UnauthorizedException })
  @ApiResponse({ status: 403, type: ForbiddenException })
  @ApiResponse({ status: 500, type: InternalServerErrorException })
  async createUser(
    @Body() body: CreateUserDto,
    @CurrentUser() currentUser: UserDto,
  ) {
    return ResultWrapper.unwrap(
      await this.userService.createUser(body, currentUser),
    )
  }
}
