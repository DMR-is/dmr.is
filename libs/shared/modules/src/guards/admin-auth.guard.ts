import { Sequelize } from 'sequelize-typescript'
import { ROLES_KEY } from '@dmr.is/constants'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { AdminUserRoleTitle } from '@dmr.is/types'

import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'

import { IAdminUserService } from '../admin-user/admin-user.service.interface'

const LOGGING_CATEGORY = 'admin-auth-guard'

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,

    @Inject(IAdminUserService)
    private readonly adminUserService: IAdminUserService,
    private readonly sequelize: Sequelize,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.get<AdminUserRoleTitle[]>(
      ROLES_KEY,
      context.getHandler(),
    )

    if (!requiredRoles) {
      return true
    }

    const request = context.switchToHttp().getRequest()
    // TODO: For now when developing locally, we dont have access to the island.is ids service (for now)
    // so we need to bypass the auth check

    // const token = request.headers.authorization
    // const user = await this.adminUserService.getUserByToken(token)
    // if (!user.result.ok) {
    //   this.logger.warn('Failed to get user by token', {
    //     error: user.result.error,
    //     category: LOGGING_CATEGORY,
    //   })
    //   throw new UnauthorizedException()
    // }

    // const nationalId = user.result.value.user.national

    const nationalId = request.headers.nationalid

    if (!nationalId) {
      this.logger.warn('Missing nationalId in request headers', {
        category: LOGGING_CATEGORY,
      })
      throw new UnauthorizedException()
    }

    const roleLookup = await this.adminUserService.checkIfUserHasRole(
      nationalId,
      requiredRoles,
    )

    if (!roleLookup.result.ok) {
      this.logger.warn('Could not get user roles', {
        error: roleLookup.result.error,
        category: LOGGING_CATEGORY,
      })

      if (roleLookup.result.error.code === 500) {
        throw new InternalServerErrorException()
      }

      if (roleLookup.result.error.code === 404) {
        throw new UnauthorizedException()
      }

      throw new ForbiddenException()
    }

    return roleLookup.result.value.hasRole
  }
}
