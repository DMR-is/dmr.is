import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'

import { IAuthorizationService } from '@dmr.is/doe-modules/authorization'
import { type DMRUser } from '@dmr.is/island-auth-nest/dmrUser'


@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    @Inject(IAuthorizationService)
    private readonly authorizationService: IAuthorizationService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const user = request.user as DMRUser | undefined

    // Defence in depth. TokenJwtAuthGuard always sets `user` or throws, and
    // DeclaredAccessGuard now refuses any chain that pairs this guard with no
    // authentication — but reading `nationalId` off undefined would surface as
    // a 500, hiding an authorization failure behind a server error.
    if (!user?.nationalId) {
      throw new UnauthorizedException()
    }

    request.adminUser = await this.authorizationService.resolveAdminUser(
      user.nationalId,
    )

    return true
  }
}
