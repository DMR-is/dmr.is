import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'

import { LogMethod } from '@dmr.is/decorators'
import { RoleGuard } from '@dmr.is/modules'

import { PartyGuard } from './party.guard'

@Injectable()
export class ApplicationGuard implements CanActivate {
  constructor(
    private readonly partyGuard: PartyGuard,
    private readonly roleGuard: RoleGuard,
  ) {}

  @LogMethod(false)
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest()

    const isInvolvedParty = req.user?.actor?.nationalId
    if (isInvolvedParty) {
      // User is acting on behalf of involved party
      return this.partyGuard.canActivate(context)
    }

    // This is a person. Use role guard.
    return this.roleGuard.canActivate(context)
  }
}
