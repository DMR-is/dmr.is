import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'

import { ApiKeyContext } from '../../../modules/api-key/api-key.types'
import { IApiKeyVerifyService } from '../../../modules/api-key/api-key-verify.service.interface'

export type ApiKeyRequest = {
  headers: Record<string, string | string[] | undefined>
  apiKeyContext?: ApiKeyContext
}

/**
 * Authenticates a caller by API key.
 *
 * The counterpart to `TokenJwtAuthGuard` on the island.is surface: it establishes
 * *who* is calling and nothing else. What they may do is a separate question,
 * answered by `RequireApiScopeGuard`.
 *
 * Accepts the credential only as `Authorization: Bearer <key>`, not as a custom
 * header or a query parameter. A key in a query string ends up in access logs,
 * browser history and referrers, and offering two ways in means two ways to get
 * it wrong.
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    @Inject(IApiKeyVerifyService)
    private readonly verifyService: IApiKeyVerifyService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<ApiKeyRequest>()
    const header = request.headers.authorization

    if (typeof header !== 'string' || !header.startsWith('Bearer ')) {
      throw new UnauthorizedException('Invalid API key')
    }

    request.apiKeyContext = await this.verifyService.verify(
      header.slice('Bearer '.length).trim(),
    )

    return true
  }
}
