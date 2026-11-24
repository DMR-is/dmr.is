import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
} from '@nestjs/common'

import { involvedPartyIdsOf } from '../application/lib/application-party'

/**
 * Lets a request through only when `:involvedPartyId` is one of the caller's
 * own involved parties. Runs after the guards that put the caller's parties
 * on `req.user.involvedParties` (ids from the role guard, party objects from
 * the party guard). Anything else is the same 404 as an unknown id.
 */
@Injectable()
export class OwnInvolvedPartyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest()
    const involvedPartyId: string | undefined = req.params?.involvedPartyId

    if (
      !involvedPartyId ||
      !involvedPartyIdsOf(req.user?.involvedParties).includes(involvedPartyId)
    ) {
      throw new NotFoundException('Involved party not found')
    }

    return true
  }
}
