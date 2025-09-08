import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common'

import { LogMethod } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { IUserService } from '@dmr.is/modules'

const LOGGING_CATEGORY = 'party-guard'
const LOGGING_CONTEXT = 'PartyGuard'

@Injectable()
export class PartyGuard implements CanActivate {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,

    @Inject(IUserService)
    private readonly userService: IUserService,
  ) {}

  @LogMethod(false)
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest()

    if (!req.user?.actor?.nationalId) {
      // User is not acting on behalf of involved party
      return true
    }

    try {
      // User is acting on behalf of involved party
      // Try by name first,
      const involvedPartyLookup =
        await this.userService.getInvolvedPartyByNationalId(
          req.user.nationalId,
          req.user.name,
        )

      if (!involvedPartyLookup.result.ok) {
        this.logger.warn('Could not find involved party', {
          error: involvedPartyLookup.result.error,
          category: LOGGING_CATEGORY,
          context: LOGGING_CONTEXT,
        })
        return false
      }
      const resParty = involvedPartyLookup.result.value

      // Look for user
      const userLookup = await this.userService.getUserByNationalId(
        req.user?.actor?.nationalId,
      )

      // If user does not exist, Create!
      if (!userLookup.result.ok) {
        this.logger.info('Could not find user, creating...', {
          error: userLookup.result.error,
          category: LOGGING_CATEGORY,
          context: LOGGING_CONTEXT,
        })

        // User has never existed, create with association
        const createdUser = await this.userService.createUserFromInvolvedParty(
          {
            nationalId: req.user?.actor?.nationalId,
            name: req.user?.actor.name,
          },
          resParty.involvedParty.id,
        )

        if (!createdUser.result.ok) {
          this.logger.warn('Could not create user in party guard', {
            error: createdUser.result.error,
            category: LOGGING_CATEGORY,
            context: LOGGING_CONTEXT,
          })
          return false
        }

        req.user = createdUser.result.value.user
        return true
      }

      // User exists, assign and continue ...
      const user = userLookup.result.value.user

      // Check if user is associated with involved party
      const involvedPartiesByUser =
        await this.userService.getInvolvedPartiesByUser(user)

      const allInvolvedParties = involvedPartiesByUser.result.ok
        ? (involvedPartiesByUser.result?.value?.involvedParties ?? [])
        : []

      const hasCurrentParty = allInvolvedParties.some(
        (party) => party.id === resParty.involvedParty.id,
      )

      if (hasCurrentParty) {
        req.user = user
        return true
      } else {
        await this.userService.associateUserToInvolvedParty(
          user.id,
          resParty.involvedParty.id,
        )
        req.user = {
          ...user,
          involvedParties: [...user.involvedParties, resParty.involvedParty.id],
        }
        return true
      }
    } catch (error) {
      this.logger.error('party guard Error:', error)
      return false
    }
  }
}
