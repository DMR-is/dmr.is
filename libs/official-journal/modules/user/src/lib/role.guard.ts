import { ROLES_KEY } from '@dmr.is/constants'
import { LogMethod } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import {
  AdvertInvolvedPartyModel,
  UserModel,
  UserRoleModel,
} from '@dmr.is/official-journal/models'
import { UserRoleTitle } from '@dmr.is/types'

import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { InjectModel } from '@nestjs/sequelize'
import { Op } from 'sequelize'

const LOGGING_CATEGORY = 'role-guard'
const LOGGING_CONTEXT = 'RoleGuard'

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,

    @InjectModel(UserModel)
    private readonly userModel: typeof UserModel,
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
      const userLookup = await this.userModel.findOne({
        include: [UserRoleModel, AdvertInvolvedPartyModel],
        where: {
          nationalId: { [Op.eq]: request.user.nationalId },
        },
      })

      if (!userLookup) {
        this.logger.warn('User not found', {
          category: LOGGING_CATEGORY,
          context: LOGGING_CONTEXT,
        })
        return false
      }

      const user = userLookup

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

      request.user = {
        id: userLookup.id,
        nationalId: userLookup.nationalId,
        firstName: userLookup.firstName,
        lastName: userLookup.lastName,
        fullName: `${userLookup.firstName} ${userLookup.lastName}`,
        displayName: userLookup.displayName,
        email: userLookup.email,
        role: {
          id: userLookup.role.id,
          title: userLookup.role.title,
          slug: userLookup.role.slug,
        },
        involvedParties: userLookup.involvedParties.map((involvedParty) => ({
          id: involvedParty.id,
          title: involvedParty.title,
          slug: involvedParty.slug,
          nationalId: involvedParty.nationalId,
        })),
        createdAt: userLookup.createdAt.toISOString(),
        updatedAt: userLookup.updatedAt.toISOString(),
        deletedAt: userLookup.deletedAt
          ? userLookup.deletedAt.toISOString()
          : null,
      }
      request.involvedParties = user.involvedParties.map((party) => party.id)

      return true
    } catch (error) {
      this.logger.error('roleLookup Error:', error)
      throw new InternalServerErrorException('User role lookup failed')
    }
  }
}
