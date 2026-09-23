import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common'

import { ApiKeyKindEnum } from '@dmr.is/doe-shared'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { ApiKeyRequest } from '../api-key/api-key.guard'

/**
 * Admits only vendor client keys, for the routes that are about the firm
 * itself rather than a company it acts for — `GET /partner/delegations`.
 *
 * The identity guard for those routes in place of `PartnerCompanyGuard`: there
 * is no tenant to resolve, so no `X-Company-National-Id` and no active-company
 * check. A company key has no delegations to list, so it is refused rather than
 * shown an empty list it could mistake for "nobody has granted me anything".
 */
@Injectable()
export class PartnerClientGuard implements CanActivate {
  constructor(@Inject(LOGGER_PROVIDER) private readonly logger: Logger) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<ApiKeyRequest>()

    if (!request.apiKeyContext) {
      this.logger.error(
        'PartnerClientGuard ran without ApiKeyGuard — fix the @UseGuards order',
        { context: 'PartnerClientGuard' },
      )
      throw new InternalServerErrorException()
    }

    if (request.apiKeyContext.kind !== ApiKeyKindEnum.PARTNER_CLIENT) {
      throw new ForbiddenException(
        'This route is for vendor client keys. A company key acts for its own company only.',
      )
    }

    return true
  }
}
