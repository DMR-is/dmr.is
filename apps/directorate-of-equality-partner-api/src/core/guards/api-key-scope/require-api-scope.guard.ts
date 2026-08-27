import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'

import { ApiKeyScopeEnum } from '@dmr.is/doe-shared'

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
@Injectable()
export class RequireApiScopeGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

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
      throw new InternalServerErrorException(
        'RequireApiScopeGuard ran without ApiKeyGuard — fix the @UseGuards order',
      )
    }

    if (!request.apiKeyContext.scopes.includes(required)) {
      throw new ForbiddenException(`API key is missing the "${required}" scope`)
    }

    return true
  }
}
