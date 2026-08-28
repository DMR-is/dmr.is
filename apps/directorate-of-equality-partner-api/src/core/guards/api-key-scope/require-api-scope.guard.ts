import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'

import { ApiKeyScopeEnum } from '@dmr.is/doe-shared'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { ApiKeyRequest } from '../api-key/api-key.guard'
import { API_SCOPE_METADATA } from './require-api-scope.decorator'

/**
 * Enforces the scope a handler declares with `@RequireApiScope`.
 *
 * Must run after `ApiKeyGuard`, which is what puts the verified scopes on the
 * request. Running without it is a wiring mistake rather than an authorization
 * failure, so it says so loudly instead of answering 403 — a 403 would read as
 * "your key lacks the scope" and send an integrator chasing a key that is fine.
 * Mirrors `RequireAdminRoleGuard` on the sibling app.
 */
/**
 * Wiring mistakes are logged, never returned.
 *
 * `HttpExceptionFilter` genericises `message` but copies the exception's own
 * message into `details`, which IS sent to the client — verified against the
 * filter directly. So an `InternalServerErrorException('...')` on a public
 * surface publishes its argument. A message-free one yields
 * `details: ["Internal Server Error"]`, which says nothing.
 *
 * The detail still has to reach whoever runs the app, so it goes to the log.
 * Same split as the rejection path in `ApiKeyVerifyService`: reason logged,
 * generic answer returned.
 */
@Injectable()
export class RequireApiScopeGuard implements CanActivate {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<ApiKeyScopeEnum>(
      API_SCOPE_METADATA,
      [context.getHandler(), context.getClass()],
    )

    if (!required) {
      return true
    }

    const request = context.switchToHttp().getRequest<ApiKeyRequest>()

    if (!request.apiKeyContext) {
      this.logger.error(
        'RequireApiScopeGuard ran without ApiKeyGuard — fix the @UseGuards order',
        { context: 'RequireApiScopeGuard' },
      )
      throw new InternalServerErrorException()
    }

    if (!request.apiKeyContext.scopes.includes(required)) {
      throw new ForbiddenException(`API key is missing the "${required}" scope`)
    }

    return true
  }
}
