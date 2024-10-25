import { isUUID } from 'class-validator'
import { Sequelize } from 'sequelize-typescript'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'

import { IApplicationUserService } from '../application-user/application-user.module'
import { IUtilityService } from '../utility/utility.service.interface'

const LOGGING_CATEGORY = 'application-auth-guard'

@Injectable()
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
    const env = process.env.NODE_ENV || 'development'
    if (env === 'development') {
      this.logger.debug(`Running in development mode, skipping auth guard`, {
        category: LOGGING_CATEGORY,
      })
      const userLookup = await this.applicationUserService.getUser('0101307789')

      if (userLookup.result.ok) {
        context.switchToHttp().getRequest().user = userLookup.result.value.user

        return true
      }

      return false
    }

    try {
      const request = context.switchToHttp().getRequest()
      const auth = request.headers?.authorization
      const applicationId = request.params?.id

      const withCase = this.reflector.get<boolean>(
        'withCase',
        context.getHandler(),
      )

      if (!isUUID(applicationId)) {
        // we have to throw to return correct status from guard
        throw new BadRequestException()
      }

      const userLookup = await this.applicationUserService.getUserFromToken(
        auth,
      )

      if (!userLookup.result.ok) {
        this.logger.warn(
          `User tried to access application with id<${applicationId}>, but the user lookup failed`,
          {
            applicationId,
            code: userLookup.result.error.code,
            message: userLookup.result.error.message,
            category: LOGGING_CATEGORY,
          },
        )
        throw new ForbiddenException()
      }

      const { user } = userLookup.result.value

      if (withCase) {
        const caseLookup = await this.utilityService.caseLookupByApplicationId(
          applicationId,
        )

        if (!caseLookup.result.ok) {
          this.logger.warn(
            `User<${user.id}> tried to access case with application id<${applicationId}> but case does not exist`,
            {
              applicationId,
              code: caseLookup.result.error.code,
              message: caseLookup.result.error.message,
              category: LOGGING_CATEGORY,
            },
          )
          throw new ForbiddenException()
        }

        const hasInvolvedParty =
          await this.applicationUserService.checkIfUserHasInvolvedParty(
            user.nationalId,
            caseLookup.result.value.involvedPartyId,
          )

        if (!hasInvolvedParty.result.ok) {
          this.logger.warn(
            `User<${user.id}> tried to access case with application id<${applicationId}>, but is not tied to institution<${caseLookup.result.value.involvedPartyId}>`,
            {
              applicationId,
              code: hasInvolvedParty.result.error.code,
              message: hasInvolvedParty.result.error.message,
              category: LOGGING_CATEGORY,
            },
          )
          throw new ForbiddenException()
        }
      }

      request.user = user

      return true
    } catch (error) {
      this.logger.error(`Error occurred in application auth guard`, {
        category: LOGGING_CATEGORY,
        error,
      })

      throw error
    }
  }
}
