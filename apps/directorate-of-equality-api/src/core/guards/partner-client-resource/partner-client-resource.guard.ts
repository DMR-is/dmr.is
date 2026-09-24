import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'

import {
  IPartnerClientService,
  PartnerClientDto,
  partnerClientMessages,
} from '@dmr.is/doe-modules/partner-client'
import { type DMRUser } from '@dmr.is/island-auth-nest/dmrUser'
import { type Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

export type PartnerClientResourceRequest = {
  user?: DMRUser
  partnerClientContext?: PartnerClientDto
}

const LOGGING_CONTEXT = 'PartnerClientResourceGuard'

/**
 * Resolves the approved provider the signed-in organisation IS, for the routes
 * where a firm manages its own vendor keys.
 *
 * The identity guard for those routes in place of `CompanyResourceGuard`, and
 * the difference is the point: a firm need not be an employer in the register,
 * so it may have no `company` row at all. `CompanyResourceGuard` would 404 such
 * a firm before its own provider record was ever looked up. This resolves the
 * live `doe_partner_client` straight from the token's kennitala instead.
 *
 * Never provisions anything. Putting a firm in the employer register would
 * make it the subject of reminders and fines.
 */
@Injectable()
export class PartnerClientResourceGuard implements CanActivate {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(IPartnerClientService)
    private readonly partnerClientService: IPartnerClientService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<PartnerClientResourceRequest>()
    const nationalId = request.user?.nationalId

    if (!nationalId) {
      this.logger.error('Current user does not have a national ID', {
        context: LOGGING_CONTEXT,
      })
      throw new UnauthorizedException()
    }

    const client =
      await this.partnerClientService.findLiveByNationalId(nationalId)

    if (!client) {
      throw new NotFoundException(partnerClientMessages.notAProvider())
    }

    request.partnerClientContext = client

    return true
  }
}
