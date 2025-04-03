import { ROLES_KEY } from '@dmr.is/constants'
import { LogMethod } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { UserRoleTitle } from '@dmr.is/types'

import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'

const LOGGING_CATEGORY = 'role-guard'
const LOGGING_CONTEXT = 'RoleGuard'

@Injectable()
export class BaseRoleGuard implements CanActivate {
  public readonly logger: Logger
  public readonly reflector: Reflector
  constructor(reflector: Reflector, @Inject(LOGGER_PROVIDER) logger: Logger) {
    this.reflector = reflector
    this.logger = logger
  }

  @LogMethod(false)
  private async getUserRoles(context: ExecutionContext) {
    let requiredRoles = this.reflector.get<UserRoleTitle[] | undefined>(
      ROLES_KEY,
      context.getHandler(),
    )

    if (!requiredRoles) {
      requiredRoles = this.reflector.get<UserRoleTitle[] | undefined>(
        ROLES_KEY,
        context.getClass(),
      )
    }
    return requiredRoles
  }

  @LogMethod(false)
  async getUserByNationalId(nationalId: string): Promise<any> {
    // Simulate a user lookup
    return {
      nationalId,
      role: {
        title: 'never',
      },
    }
  }

  @LogMethod(false)
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const requiredRoles = await this.getUserRoles(context)
    if (!requiredRoles) {
      return true
    }
    const user = await this.getUserByNationalId(request.user.nationalId)

    if (!user) {
      this.logger.warn('User not found', {
        category: LOGGING_CATEGORY,
        context: LOGGING_CONTEXT,
      })
      return false
    }
    const hasAccess = requiredRoles.some((role) => user.role.title === role)
    if (!hasAccess) {
      this.logger.warn('User does not have required roles', {
        category: LOGGING_CATEGORY,
        context: LOGGING_CONTEXT,
      })
      return false
    }
    request.user = user
    return true
  }
}
