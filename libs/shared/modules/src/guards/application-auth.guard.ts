import { isUUID } from 'class-validator'
import { decode } from 'jsonwebtoken'
import { Sequelize } from 'sequelize-typescript'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'

import { IApplicationUserService } from '../application-user/application-user.module'
import { IUtilityService } from '../utility/utility.service.interface'

export class ApplicationAuthGaurd implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(IApplicationUserService)
    private readonly applicationUserService: IApplicationUserService,
    @Inject(IUtilityService) private readonly utilityService: IUtilityService,

    private readonly sequelize: Sequelize,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()

    const auth = request.headers?.authorization

    if (!auth) {
      return false
    }

    const token = auth.split(' ')[1]

    // TODO: USE VERIFY HERE LATER
    const user = decode(token)

    if (!user || typeof user === 'string') {
      return false
    }

    const nationalId = user?.nationalId

    if (!nationalId) {
      return false
    }

    request.nationalId = nationalId

    // lookup user and find out if they are allowed to access the resource
    try {
      const userLookup = await this.applicationUserService.getUser(nationalId)

      if (userLookup.result.ok === false) {
        throw new ForbiddenException()
      }

      const { user } = userLookup.result.value

      const applicationId = request.params?.id

      if (!isUUID(applicationId)) {
        // we have to throw to return correct status from guard
        throw new BadRequestException()
      }

      const withCase = this.reflector.get<boolean>(
        'withCase',
        context.getHandler(),
      )

      if (withCase) {
        const currentCase = (
          await this.utilityService.caseLookupByApplicationId(applicationId)
        ).unwrap()

        const caseInstitution = currentCase.involvedPartyId

        const hasAccessToCase = user.involvedParties.find(
          (party) => party.id === caseInstitution,
        )

        if (!hasAccessToCase) {
          this.logger.warn(
            `User<${user.id}> tried to access case with application id<${applicationId}> but is not allowed`,
            {
              applicationId,
              category: 'auth-guard',
            },
          )
          throw new ForbiddenException()
        }
      }

      request.user = user

      return true
    } catch (error) {
      this.logger.warn(`Auth guard denied incoming request`, {
        category: 'auth-guard',
        error,
      })
      return false
    }
  }
}
