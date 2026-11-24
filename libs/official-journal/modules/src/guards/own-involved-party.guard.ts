import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
} from '@nestjs/common'

import { UserRoleEnum } from '@dmr.is/constants'

import { involvedPartyIdsOf } from '../auth/application-party'

/**
 * Lets a request through only when `:involvedPartyId` is one of the caller's
 * own involved parties. Runs after the guards that put the caller's parties
 * on `req.user.involvedParties` (ids from the role guard, party objects from
 * the party guard). An editorial admin may read any involved party's
 * signature, matching what the admin is offered when filing. Anything else is
 * the same 404 as an unknown id.
 */
@Injectable()
export class OwnInvolvedPartyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest()
    const involvedPartyId: string | undefined = req.params?.involvedPartyId

    if (req.user?.role?.title === UserRoleEnum.Admin) {
      return true
    }

    if (
      !involvedPartyId ||
      !involvedPartyIdsOf(req.user?.involvedParties).includes(involvedPartyId)
    ) {
      throw new NotFoundException('Involved party not found')
    }

    return true
  }
}
