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

import { IUserService } from './user.service.interface'

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,

    @Inject(IUserService) private readonly userService: IUserService,
  ) {}

  @LogMethod(false)
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()

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

    if (!requiredRoles) {
      return true
    }

    const { user } = (
      await this.userService.getUserByNationalId(request.user.nationalId)
    ).unwrap()

    const hasAccess = requiredRoles.some((role) => user.role.title === role)

    if (!hasAccess) {
      return false
    }

    request.user = user
    return true
  }
}
