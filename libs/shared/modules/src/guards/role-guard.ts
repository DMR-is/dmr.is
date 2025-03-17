import { ROLES_KEY } from '@dmr.is/constants'
import { LogMethod } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { UserRoleTitle } from '@dmr.is/types'

import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'

import { IUserService } from '../user/user.service.interface'

const LOGGING_CATEGORY = 'role-guard'
const LOGGING_CONTEXT = 'RoleGuard'

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,

    @Inject(IUserService)
    private readonly userService: IUserService,
  ) {}

  @LogMethod(false)
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()

    let requiredRoles = this.reflector.get<UserRoleTitle[] | undefined>(
      ROLES_KEY,
      context.getHandler(),
    )

    if (!requiredRoles) {
      // check if the controller has role metadata
      requiredRoles = this.reflector.get<UserRoleTitle[] | undefined>(
        ROLES_KEY,
        context.getClass(),
      )
    }

    try {
      // Check if user has required roles
      const userLookup = await this.userService.getUserByNationalId(
        request.user.nationalId,
      )

      if (!userLookup.result.ok) {
        this.logger.warn('Could not find user', {
          error: userLookup.result.error,
          category: LOGGING_CATEGORY,
          context: LOGGING_CONTEXT,
        })
        return false
      }

      const user = userLookup.result.value.user

      const hasRole = requiredRoles?.some((role) =>
        user.role.title === role ? true : false,
      )

      if (!hasRole) {
        this.logger.warn('User does not have required roles', {
          user: user,
          requiredRoles: requiredRoles,
          category: LOGGING_CATEGORY,
          context: LOGGING_CONTEXT,
        })
        return false
      }

      request.user = user
      request.involvedParties = user.involvedParties.map((party) => party.id)

      return true
    } catch (error) {
      this.logger.error('roleLookup Error:', error)
      throw new InternalServerErrorException('User role lookup failed')
    }
  }
}
