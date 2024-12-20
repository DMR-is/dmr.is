import { isUUID } from 'class-validator'
import { decode } from 'jsonwebtoken'
import { Sequelize } from 'sequelize-typescript'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { ApplicationUser } from '@dmr.is/shared/dto'

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
        this.logger.warn(
          `User tried to access application with invalid id<${applicationId}>`,
          {
            applicationId,
            category: LOGGING_CATEGORY,
          },
        )
        throw new BadRequestException()
      }

      let currentUser: ApplicationUser | null = null
      try {
        const decodedToken = decode(auth.split('Bearer ')[1])

        if (!decodedToken || typeof decodedToken === 'string') {
          this.logger.warn(
            `User tried to access application with invalid token`,
            {
              category: LOGGING_CATEGORY,
            },
          )
          throw new ForbiddenException()
        }

        const { nationalId } = decodedToken

        const user = await this.applicationUserService.getUserByNationalId(
          nationalId,
        )

        if (!user.result.ok) {
          this.logger.warn(
            `User<${nationalId}> tried to access application with id<${applicationId}> but user does not exist`,
            {
              nationalId,
              applicationId,
              code: user.result.error.code,
              message: user.result.error.message,
              category: LOGGING_CATEGORY,
            },
          )
          throw new ForbiddenException()
        }

        currentUser = user.result.value.user
      } catch (error) {
        this.logger.warn(`Exception caught in application auth gaurd`, {
          error: error,
          category: LOGGING_CATEGORY,
          context: LOGGING_CATEGORY,
        })
        throw new ForbiddenException()
      }

      if (!currentUser) {
        throw new ForbiddenException()
      }

      if (withCase) {
        const caseLookup = await this.utilityService.caseLookupByApplicationId(
          applicationId,
        )

        if (!caseLookup.result.ok) {
          this.logger.warn(
            `User<${currentUser.id}> tried to access case with application id<${applicationId}> but case does not exist`,
            {
              applicationId,
              code: caseLookup.result.error.code,
              message: caseLookup.result.error.message,
              category: LOGGING_CATEGORY,
              context: LOGGING_CATEGORY,
            },
          )
          throw new ForbiddenException()
        }

        const hasInvolvedParty =
          await this.applicationUserService.checkIfUserHasInvolvedParty(
            currentUser.nationalId,
            caseLookup.result.value.involvedPartyId,
          )

        if (!hasInvolvedParty.result.ok) {
          this.logger.warn(
            `User<${currentUser.id}> tried to access case with application id<${applicationId}>, but is not tied to institution<${caseLookup.result.value.involvedPartyId}>`,
            {
              applicationId,
              code: hasInvolvedParty.result.error.code,
              message: hasInvolvedParty.result.error.message,
              category: LOGGING_CATEGORY,
              context: LOGGING_CATEGORY,
            },
          )
          throw new ForbiddenException()
        }
      }

      request.user = currentUser

      return true
    } catch (error) {
      this.logger.error(`Error occurred in application auth guard`, {
        category: LOGGING_CATEGORY,
        context: LOGGING_CATEGORY,
        error,
      })

      throw error
    }
  }
}
