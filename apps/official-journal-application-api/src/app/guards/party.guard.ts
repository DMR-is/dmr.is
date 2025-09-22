import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common'

import { UserRoleEnum } from '@dmr.is/constants'
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
      return false
    }

    try {
      // User is acting on behalf of involved party
      const involvedPartyLookup =
        await this.userService.getInvolvedPartyByNationalId(req.user.nationalId)

      if (!involvedPartyLookup.result.ok) {
        this.logger.warn('Could not find involved party', {
          error: involvedPartyLookup.result.error,
          category: LOGGING_CATEGORY,
          context: LOGGING_CONTEXT,
        })
        return false
      }
      const resParty = involvedPartyLookup.result.value
      req.user.role = {
        title: UserRoleEnum.InvolvedParty,
      }

      if (resParty.involvedParty.nationalId) {
        // Involved party exists.
        return true
      }
      return false
    } catch (error) {
      this.logger.error('party guard Error:', error)
      return false
    }
  }
}
