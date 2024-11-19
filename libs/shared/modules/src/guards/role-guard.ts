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
export class RoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,

    @Inject(IAdminUserService)
    private readonly adminUserService: IAdminUserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()

    const requiredRoles = this.reflector.get<AdminUserRoleTitle[]>(
      ROLES_KEY,
      context.getHandler(),
    )

    try {
      // Check if user has required roles
      const roleLookup = await this.adminUserService.checkIfUserHasRole(
        request.user.nationalId,
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

      if (!roleLookup.result.value.hasRole) {
        throw new UnauthorizedException(
          'Invalid role provided, required role: ' + requiredRoles,
        )
      }

      return true
    } catch (error) {
      this.logger.error('roleLookup Error:', error)
      throw new InternalServerErrorException('User role lookup failed')
    }
  }
}
