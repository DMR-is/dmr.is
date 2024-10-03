import { Sequelize } from 'sequelize-typescript'
import { ROLES_KEY } from '@dmr.is/constants'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { AdminUserRoleTitle } from '@dmr.is/types'

import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'

import { IAdminUserService } from '../admin-user/admin-user.service.interface'

const LOGGING_CATEGORY = 'admin-auth-guard'

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
    const auth = request.headers?.authorization

    const checkIfUserHasRole = await this.adminUserService.checkIfUserHasRole(
      auth,
      requiredRoles,
    )

    if (!checkIfUserHasRole.result.ok) {
      this.logger.warn('Failed to check if user has role', {
        error: checkIfUserHasRole.result.error,
        category: LOGGING_CATEGORY,
      })
      throw new ForbiddenException()
    }

    return checkIfUserHasRole.result.value.hasRole
  }
}
