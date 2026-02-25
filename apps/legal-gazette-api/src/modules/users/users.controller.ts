import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth } from '@nestjs/swagger'

import { type DMRUser } from '@dmr.is/auth/dmrUser'
import { CurrentUser } from '@dmr.is/decorators'
import { PagingQuery } from '@dmr.is/shared-dto'
import { TokenJwtAuthGuard } from '@dmr.is/shared-modules'

import { AdminAccess } from '../../core/decorators/admin.decorator'
import { LGResponse } from '../../core/decorators/lg-response.decorator'
import { AuthorizationGuard } from '../../core/guards/authorization.guard'
import {
  CreateUserDto,
  GetUsersResponse,
  GetUsersWithPagingResponse,
  UpdateUserDto,
  UserDto,
} from '../../models/users.model'
import { IUsersService } from './users.service.interface'

@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard, AuthorizationGuard)
@AdminAccess()
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
  getMyUser(@CurrentUser() user: UserDto): Promise<UserDto> {
    return this.usersService.getUserByNationalId(user.nationalId)
  }

  @Get('employees')
  @LGResponse({ operationId: 'getEmployees', type: GetUsersResponse })
  getEmployees(): Promise<GetUsersResponse> {
    return this.usersService.getEmployees()
  }

  @Post()
  @LGResponse({ operationId: 'createUser', type: UserDto })
  createUser(
    @Body() createUserDto: CreateUserDto,
    @CurrentUser() user: DMRUser,
  ): Promise<UserDto> {
    return this.usersService.createUser(createUserDto, user)
  }

  @Get()
  @LGResponse({ operationId: 'getUsers', type: GetUsersWithPagingResponse })
  getUsers(@Query() query: PagingQuery): Promise<GetUsersWithPagingResponse> {
    return this.usersService.getUsers(query)
  }

  @Delete(':userId')
  @LGResponse({ operationId: 'deleteUser' })
  deleteUser(
    @Param('userId') userId: string,
    @CurrentUser() user: DMRUser,
  ): Promise<void> {
    return this.usersService.deleteUser(userId, user)
  }

  @Patch(':userId')
  @LGResponse({ operationId: 'updateUser', type: UserDto })
  updateUser(
    @Param('userId') userId: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() user: DMRUser,
  ): Promise<UserDto> {
    return this.usersService.updateUser(userId, updateUserDto, user)
  }

  @Post(':userId/restore')
  @LGResponse({ operationId: 'restoreUser', type: UserDto })
  restoreUser(
    @Param('userId') userId: string,
    @CurrentUser() user: DMRUser,
  ): Promise<UserDto> {
    return this.usersService.restoreUser(userId, user)
  }
}
